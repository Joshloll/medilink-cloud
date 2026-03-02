const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { query } = require('../config/database');
const { hashPassword } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get system statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'patient') as total_patients,
        (SELECT COUNT(*) FROM users WHERE role = 'doctor') as total_doctors,
        (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled') as scheduled_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed') as completed_appointments,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE) as today_appointments,
        (SELECT COUNT(*) FROM health_records) as total_health_records,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_month,
        (SELECT COUNT(*) FROM appointments WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as appointments_last_week
    `);

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

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, search, limit = 50, offset = 0 } = req.query;
    
    let queryText = `
      SELECT id, email, role, first_name, last_name, phone, 
             specialization, department, is_active, is_verified, created_at, last_login
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (role) {
      queryText += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (isActive !== undefined) {
      queryText += ` AND is_active = $${paramCount}`;
      params.push(isActive === 'true');
      paramCount++;
    }

    if (search) {
      queryText += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        users: result.rows
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
});

// Get single user
router.get('/users/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, email, role, first_name, last_name, phone, date_of_birth, gender,
              address, city, state, zip_code, emergency_contact_name, emergency_contact_phone,
              specialization, license_number, department, profile_image,
              is_active, is_verified, created_at, updated_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
});

// Create user
router.post(
  '/users',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        specialization,
        licenseNumber,
        department,
        isActive = true,
        isVerified = false
      } = req.body;

      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'Email already registered'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Insert new user
      const result = await query(
        `INSERT INTO users (
          email, password, role, first_name, last_name, phone, date_of_birth, gender,
          specialization, license_number, department, is_active, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, email, role, first_name, last_name, is_active, is_verified, created_at`,
        [
          email,
          hashedPassword,
          role,
          firstName,
          lastName,
          phone || null,
          dateOfBirth || null,
          gender || null,
          specialization || null,
          licenseNumber || null,
          department || null,
          isActive,
          isVerified
        ]
      );

      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
          user: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create user',
        error: error.message
      });
    }
  }
);

// Update user
router.patch('/users/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      isActive,
      isVerified,
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

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }

    if (isVerified !== undefined) {
      updates.push(`is_verified = $${paramCount}`);
      values.push(isVerified);
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
      WHERE id = $${paramCount}
      RETURNING id, email, role, first_name, last_name, is_active, is_verified
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Delete user
router.delete('/users/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting admin users
    const userCheck = await query('SELECT role FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (userCheck.rows[0].role === 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot delete admin users'
      });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Get all appointments (admin view)
router.get('/appointments', async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 100, offset = 0 } = req.query;
    
    let queryText = `
      SELECT a.*, 
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name,
             d.specialization
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (startDate) {
      queryText += ` AND a.appointment_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND a.appointment_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    queryText += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

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

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const appointments = await query(
      `SELECT a.id, a.created_at, a.status, a.appointment_date,
              p.first_name as patient_name, d.first_name as doctor_name,
              'appointment' as activity_type
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );

    const users = await query(
      `SELECT id, created_at, role, first_name, last_name,
              'user_registration' as activity_type
       FROM users
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    // Combine and sort activities
    const activities = [...appointments.rows, ...users.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    res.status(200).json({
      status: 'success',
      results: activities.length,
      data: {
        activities
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve activity',
      error: error.message
    });
  }
});

module.exports = router;
