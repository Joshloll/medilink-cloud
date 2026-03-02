const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { query } = require('../config/database');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const { specialization, department, search } = req.query;
    
    let queryText = `
      SELECT id, email, first_name, last_name, phone, specialization, 
             license_number, department, profile_image, is_active
      FROM users 
      WHERE role = 'doctor' AND is_active = true
    `;
    const params = [];
    let paramCount = 1;

    if (specialization) {
      queryText += ` AND specialization = $${paramCount}`;
      params.push(specialization);
      paramCount++;
    }

    if (department) {
      queryText += ` AND department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR specialization ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ' ORDER BY last_name, first_name';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        doctors: result.rows
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve doctors',
      error: error.message
    });
  }
});

// Get single doctor
router.get('/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, email, first_name, last_name, phone, specialization, 
              license_number, department, profile_image, created_at, is_active
       FROM users 
       WHERE id = $1 AND role = 'doctor'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        doctor: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve doctor',
      error: error.message
    });
  }
});

// Update doctor profile (doctors and admins only)
router.patch('/:id', authorize('doctor', 'admin'), param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Doctors can only update their own profile
    if (req.user.role === 'doctor' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const {
      firstName,
      lastName,
      phone,
      specialization,
      department
    } = req.body;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName) {
      updates.push(`first_name = $${paramCount}`);
      values.push(firstName);
      paramCount++;
    }

    if (lastName) {
      updates.push(`last_name = $${paramCount}`);
      values.push(lastName);
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (specialization) {
      updates.push(`specialization = $${paramCount}`);
      values.push(specialization);
      paramCount++;
    }

    if (department) {
      updates.push(`department = $${paramCount}`);
      values.push(department);
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
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} AND role = 'doctor'
      RETURNING id, email, first_name, last_name, phone, specialization, department
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Doctor profile updated successfully',
      data: {
        doctor: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update doctor profile',
      error: error.message
    });
  }
});

// Get doctor's schedule
router.get('/:id/schedule', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Doctors can only view their own detailed schedule
    if (req.user.role === 'doctor' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    let queryText = `
      SELECT a.*, 
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             p.phone as patient_phone, p.date_of_birth
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      WHERE a.doctor_id = $1
    `;
    const params = [id];
    let paramCount = 2;

    if (date) {
      queryText += ` AND a.appointment_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    } else {
      // Default to today's date if not specified
      queryText += ` AND a.appointment_date >= CURRENT_DATE`;
    }

    queryText += ' ORDER BY a.appointment_date, a.appointment_time';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        schedule: result.rows
      }
    });
  } catch (error) {
    console.error('Get doctor schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve schedule',
      error: error.message
    });
  }
});

// Get or update doctor availability
router.get('/:id/availability', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM doctor_availability 
       WHERE doctor_id = $1 
       ORDER BY day_of_week, start_time`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        availability: result.rows
      }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve availability',
      error: error.message
    });
  }
});

// Set doctor availability (doctors and admins only)
router.post(
  '/:id/availability',
  authorize('doctor', 'admin'),
  param('id').isInt(),
  [
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Doctors can only set their own availability
      if (req.user.role === 'doctor' && req.user.id !== parseInt(id)) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      const { dayOfWeek, startTime, endTime, isAvailable = true } = req.body;

      // Check if availability already exists for this day
      const existingAvailability = await query(
        'SELECT id FROM doctor_availability WHERE doctor_id = $1 AND day_of_week = $2',
        [id, dayOfWeek]
      );

      let result;
      if (existingAvailability.rows.length > 0) {
        // Update existing
        result = await query(
          `UPDATE doctor_availability 
           SET start_time = $1, end_time = $2, is_available = $3
           WHERE doctor_id = $4 AND day_of_week = $5
           RETURNING *`,
          [startTime, endTime, isAvailable, id, dayOfWeek]
        );
      } else {
        // Insert new
        result = await query(
          `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [id, dayOfWeek, startTime, endTime, isAvailable]
        );
      }

      res.status(200).json({
        status: 'success',
        message: 'Availability updated successfully',
        data: {
          availability: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Set availability error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to set availability',
        error: error.message
      });
    }
  }
);

// Get doctor statistics (doctors and admins only)
router.get('/:id/statistics', authorize('doctor', 'admin'), param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Doctors can only view their own statistics
    if (req.user.role === 'doctor' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const stats = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
         COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE) as today_count,
         COUNT(*) FILTER (WHERE appointment_date > CURRENT_DATE) as upcoming_count
       FROM appointments
       WHERE doctor_id = $1`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        statistics: stats.rows[0]
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

module.exports = router;
