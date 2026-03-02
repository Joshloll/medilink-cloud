const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { query } = require('../config/database');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all patients (doctors and admins only)
router.get('/', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    
    let queryText = `
      SELECT id, email, first_name, last_name, phone, date_of_birth, gender, 
             address, city, state, zip_code, created_at, is_active
      FROM users 
      WHERE role = 'patient'
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY last_name, first_name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        patients: result.rows
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve patients',
      error: error.message
    });
  }
});

// Get single patient
router.get('/:id', authorize('patient', 'doctor', 'admin'), param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Patients can only view their own profile
    if (req.user.role === 'patient' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const result = await query(
      `SELECT id, email, first_name, last_name, phone, date_of_birth, gender, 
              address, city, state, zip_code, emergency_contact_name, 
              emergency_contact_phone, profile_image, created_at, is_active
       FROM users 
       WHERE id = $1 AND role = 'patient'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        patient: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve patient',
      error: error.message
    });
  }
});

// Update patient profile
router.patch('/:id', authorize('patient', 'admin'), param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Patients can only update their own profile
    if (req.user.role === 'patient' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      emergencyContactName,
      emergencyContactPhone
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

    if (dateOfBirth) {
      updates.push(`date_of_birth = $${paramCount}`);
      values.push(dateOfBirth);
      paramCount++;
    }

    if (gender) {
      updates.push(`gender = $${paramCount}`);
      values.push(gender);
      paramCount++;
    }

    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }

    if (city) {
      updates.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }

    if (state) {
      updates.push(`state = $${paramCount}`);
      values.push(state);
      paramCount++;
    }

    if (zipCode) {
      updates.push(`zip_code = $${paramCount}`);
      values.push(zipCode);
      paramCount++;
    }

    if (emergencyContactName !== undefined) {
      updates.push(`emergency_contact_name = $${paramCount}`);
      values.push(emergencyContactName);
      paramCount++;
    }

    if (emergencyContactPhone !== undefined) {
      updates.push(`emergency_contact_phone = $${paramCount}`);
      values.push(emergencyContactPhone);
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
      WHERE id = $${paramCount} AND role = 'patient'
      RETURNING id, email, first_name, last_name, phone, date_of_birth, gender, 
                address, city, state, zip_code, emergency_contact_name, emergency_contact_phone
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Patient profile updated successfully',
      data: {
        patient: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update patient profile',
      error: error.message
    });
  }
});

// Get patient's appointment history
router.get('/:id/appointments', authorize('patient', 'doctor', 'admin'), param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Patients can only view their own appointments
    if (req.user.role === 'patient' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const result = await query(
      `SELECT a.*, 
              d.first_name as doctor_first_name, d.last_name as doctor_last_name, 
              d.specialization, d.department
       FROM appointments a
       JOIN users d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        appointments: result.rows
      }
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve appointments',
      error: error.message
    });
  }
});

// Get patient's health records
router.get('/:id/health-records', authorize('patient', 'doctor', 'admin'), param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Patients can only view their own records
    if (req.user.role === 'patient' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const result = await query(
      `SELECT hr.*, 
              d.first_name as doctor_first_name, d.last_name as doctor_last_name,
              d.specialization
       FROM health_records hr
       LEFT JOIN users d ON hr.doctor_id = d.id
       WHERE hr.patient_id = $1
       ORDER BY hr.record_date DESC, hr.created_at DESC`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        healthRecords: result.rows
      }
    });
  } catch (error) {
    console.error('Get patient health records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve health records',
      error: error.message
    });
  }
});

module.exports = router;
