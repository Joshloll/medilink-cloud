const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { query } = require('../config/database');

const router = express.Router();

// All routes require authentication and doctor/admin role
router.use(authenticate);
router.use(authorize('doctor', 'admin'));

// Get all health records (filtered by permissions)
router.get('/', async (req, res) => {
  try {
    const { patientId, recordType, startDate, endDate } = req.query;
    
    let queryText = `
      SELECT hr.*, 
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM health_records hr
      JOIN users p ON hr.patient_id = p.id
      LEFT JOIN users d ON hr.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Doctors can only see records they created
    if (req.user.role === 'doctor') {
      queryText += ` AND hr.doctor_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    if (patientId) {
      queryText += ` AND hr.patient_id = $${paramCount}`;
      params.push(patientId);
      paramCount++;
    }

    if (recordType) {
      queryText += ` AND hr.record_type = $${paramCount}`;
      params.push(recordType);
      paramCount++;
    }

    if (startDate) {
      queryText += ` AND hr.record_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND hr.record_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    queryText += ' ORDER BY hr.record_date DESC, hr.created_at DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: {
        healthRecords: result.rows
      }
    });
  } catch (error) {
    console.error('Get health records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve health records',
      error: error.message
    });
  }
});

// Get single health record
router.get('/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    let queryText = `
      SELECT hr.*, 
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             p.date_of_birth, p.gender,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name,
             d.specialization
      FROM health_records hr
      JOIN users p ON hr.patient_id = p.id
      LEFT JOIN users d ON hr.doctor_id = d.id
      WHERE hr.id = $1
    `;
    const params = [id];

    // Doctors can only see records they created
    if (req.user.role === 'doctor') {
      queryText += ' AND hr.doctor_id = $2';
      params.push(req.user.id);
    }

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Health record not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        healthRecord: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get health record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve health record',
      error: error.message
    });
  }
});

// Create health record
router.post(
  '/',
  [
    body('patientId').isInt().withMessage('Valid patient ID is required'),
    body('recordType').trim().notEmpty().withMessage('Record type is required'),
    body('recordDate').isISO8601().withMessage('Valid date is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        patientId,
        appointmentId,
        recordType,
        recordDate,
        title,
        description,
        diagnosis,
        treatment,
        medications,
        allergies,
        vitalSigns,
        labResults
      } = req.body;

      // Verify patient exists
      const patientCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [patientId, 'patient']
      );

      if (patientCheck.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }

      const result = await query(
        `INSERT INTO health_records (
          patient_id, doctor_id, appointment_id, record_type, record_date,
          title, description, diagnosis, treatment, medications, allergies,
          vital_signs, lab_results
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          patientId,
          req.user.id,
          appointmentId || null,
          recordType,
          recordDate,
          title,
          description || null,
          diagnosis || null,
          treatment || null,
          medications || null,
          allergies || null,
          vitalSigns ? JSON.stringify(vitalSigns) : null,
          labResults ? JSON.stringify(labResults) : null
        ]
      );

      res.status(201).json({
        status: 'success',
        message: 'Health record created successfully',
        data: {
          healthRecord: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Create health record error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create health record',
        error: error.message
      });
    }
  }
);

// Update health record
router.patch('/:id', param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if record exists and user has permission
    let checkQuery = 'SELECT * FROM health_records WHERE id = $1';
    const checkParams = [id];

    if (req.user.role === 'doctor') {
      checkQuery += ' AND doctor_id = $2';
      checkParams.push(req.user.id);
    }

    const recordCheck = await query(checkQuery, checkParams);

    if (recordCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Health record not found or access denied'
      });
    }

    const {
      recordType,
      recordDate,
      title,
      description,
      diagnosis,
      treatment,
      medications,
      allergies,
      vitalSigns,
      labResults
    } = req.body;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (recordType) {
      updates.push(`record_type = $${paramCount}`);
      values.push(recordType);
      paramCount++;
    }

    if (recordDate) {
      updates.push(`record_date = $${paramCount}`);
      values.push(recordDate);
      paramCount++;
    }

    if (title) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (diagnosis !== undefined) {
      updates.push(`diagnosis = $${paramCount}`);
      values.push(diagnosis);
      paramCount++;
    }

    if (treatment !== undefined) {
      updates.push(`treatment = $${paramCount}`);
      values.push(treatment);
      paramCount++;
    }

    if (medications !== undefined) {
      updates.push(`medications = $${paramCount}`);
      values.push(medications);
      paramCount++;
    }

    if (allergies !== undefined) {
      updates.push(`allergies = $${paramCount}`);
      values.push(allergies);
      paramCount++;
    }

    if (vitalSigns) {
      updates.push(`vital_signs = $${paramCount}`);
      values.push(JSON.stringify(vitalSigns));
      paramCount++;
    }

    if (labResults) {
      updates.push(`lab_results = $${paramCount}`);
      values.push(JSON.stringify(labResults));
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
      UPDATE health_records 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    res.status(200).json({
      status: 'success',
      message: 'Health record updated successfully',
      data: {
        healthRecord: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update health record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update health record',
      error: error.message
    });
  }
});

// Delete health record (admin only)
router.delete('/:id', authorize('admin'), param('id').isInt(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM health_records WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Health record not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    console.error('Delete health record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete health record',
      error: error.message
    });
  }
});

module.exports = router;
