const express = require('express');
const { body, param, query: queryValidator } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { query, transaction } = require('../config/database');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const appointmentValidation = [
  body('doctorId').isInt().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM)'),
  body('reasonForVisit').optional().trim()
];

// Get all appointments (filtered by role)
router.get('/', async (req, res) => {
  try {
    const { status, date, doctorId } = req.query;
    let queryText = `
      SELECT a.*, 
             p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter based on user role
    if (req.user.role === 'patient') {
      queryText += ` AND a.patient_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (req.user.role === 'doctor') {
      queryText += ` AND a.doctor_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    // Additional filters
    if (status) {
      queryText += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (date) {
      queryText += ` AND a.appointment_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    if (doctorId && req.user.role === 'admin') {
      queryText += ` AND a.doctor_id = $${paramCount}`;
      params.push(doctorId);
      paramCount++;
    }

    queryText += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        appointments: result.rows
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve appointments',
      error: error.message
    });
  }
});

// Get single appointment
router.get('/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    let queryText = `
      SELECT a.*, 
             p.first_name as patient_first_name, p.last_name as patient_last_name, 
             p.email as patient_email, p.phone as patient_phone, p.date_of_birth,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name, 
             d.specialization, d.department
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE a.id = $1
    `;
    const params = [id];

    // Restrict access based on role
    if (req.user.role === 'patient') {
      queryText += ' AND a.patient_id = $2';
      params.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      queryText += ' AND a.doctor_id = $2';
      params.push(req.user.id);
    }

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        appointment: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve appointment',
      error: error.message
    });
  }
});

// Create appointment (patients only)
router.post(
  '/',
  authorize('patient', 'admin'),
  appointmentValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { doctorId, appointmentDate, appointmentTime, reasonForVisit } = req.body;
      const patientId = req.user.role === 'patient' ? req.user.id : req.body.patientId;

      // Check if doctor exists and is active
      const doctorCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true',
        [doctorId, 'doctor']
      );

      if (doctorCheck.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Doctor not found or inactive'
        });
      }

      // Check for conflicting appointments
      const conflictCheck = await query(
        `SELECT id FROM appointments 
         WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 
         AND status NOT IN ('cancelled', 'no-show')`,
        [doctorId, appointmentDate, appointmentTime]
      );

      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'This time slot is already booked'
        });
      }

      // Create appointment
      const result = await query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [patientId, doctorId, appointmentDate, appointmentTime, reasonForVisit || null, 'scheduled']
      );

      res.status(201).json({
        status: 'success',
        message: 'Appointment created successfully',
        data: {
          appointment: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create appointment',
        error: error.message
      });
    }
  }
);

// Update appointment
router.patch('/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, status, notes, diagnosis, prescription } = req.body;

    // Check if appointment exists and user has permission
    let checkQuery = 'SELECT * FROM appointments WHERE id = $1';
    const checkParams = [id];

    if (req.user.role === 'patient') {
      checkQuery += ' AND patient_id = $2';
      checkParams.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      checkQuery += ' AND doctor_id = $2';
      checkParams.push(req.user.id);
    }

    const appointmentCheck = await query(checkQuery, checkParams);

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found or access denied'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (appointmentDate) {
      updates.push(`appointment_date = $${paramCount}`);
      values.push(appointmentDate);
      paramCount++;
    }

    if (appointmentTime) {
      updates.push(`appointment_time = $${paramCount}`);
      values.push(appointmentTime);
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
      
      if (status === 'cancelled') {
        updates.push(`cancelled_at = CURRENT_TIMESTAMP`);
      }
    }

    if (notes && req.user.role !== 'patient') {
      updates.push(`notes = $${paramCount}`);
      values.push(notes);
      paramCount++;
    }

    if (diagnosis && req.user.role === 'doctor') {
      updates.push(`diagnosis = $${paramCount}`);
      values.push(diagnosis);
      paramCount++;
    }

    if (prescription && req.user.role === 'doctor') {
      updates.push(`prescription = $${paramCount}`);
      values.push(prescription);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    values.push(id);
    const updateQuery = `
      UPDATE appointments 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    res.status(200).json({
      status: 'success',
      message: 'Appointment updated successfully',
      data: {
        appointment: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update appointment',
      error: error.message
    });
  }
});

// Cancel appointment
router.delete('/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    // Check if appointment exists and user has permission
    let checkQuery = 'SELECT * FROM appointments WHERE id = $1';
    const checkParams = [id];

    if (req.user.role === 'patient') {
      checkQuery += ' AND patient_id = $2';
      checkParams.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      checkQuery += ' AND doctor_id = $2';
      checkParams.push(req.user.id);
    }

    const appointmentCheck = await query(checkQuery, checkParams);

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found or access denied'
      });
    }

    // Update appointment status to cancelled
    const result = await query(
      `UPDATE appointments 
       SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = $1
       WHERE id = $2
       RETURNING *`,
      [cancellationReason || null, id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      data: {
        appointment: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
});

// Get available time slots for a doctor
router.get('/available-slots/:doctorId', param('doctorId').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Date parameter is required'
      });
    }

    // Get doctor availability for the day
    const dayOfWeek = new Date(date).getDay();
    const availability = await query(
      `SELECT start_time, end_time FROM doctor_availability 
       WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = true`,
      [doctorId, dayOfWeek]
    );

    if (availability.rows.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Doctor not available on this day',
        data: {
          availableSlots: []
        }
      });
    }

    // Get booked appointments for the date
    const bookedSlots = await query(
      `SELECT appointment_time FROM appointments 
       WHERE doctor_id = $1 AND appointment_date = $2 
       AND status NOT IN ('cancelled', 'no-show')`,
      [doctorId, date]
    );

    const booked = bookedSlots.rows.map(row => row.appointment_time);

    // Generate available time slots (30-minute intervals)
    const slots = [];
    const { start_time, end_time } = availability.rows[0];
    
    // This is a simplified version - you would implement proper time slot generation
    const startHour = parseInt(start_time.split(':')[0]);
    const endHour = parseInt(end_time.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      ['00', '30'].forEach(minute => {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute}:00`;
        if (!booked.includes(timeSlot)) {
          slots.push(timeSlot);
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        availableSlots: slots
      }
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve available slots',
      error: error.message
    });
  }
});

module.exports = router;
