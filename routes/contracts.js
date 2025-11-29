const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, devBypass, devBypassAdmin } = require('../middleware/auth');

// Get all contracts (admin only)
router.get('/', devBypassAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status && status !== 'all') {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      whereClause += ' AND c.type = ?';
      params.push(type);
    }

    if (search) {
      whereClause += ' AND (c.title LIKE ? OR c.party_name LIKE ? OR c.contract_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const contracts = await db.query(`
      SELECT 
        c.*,
        ct.name as template_name,
        ct.category as template_category
      FROM contracts c
      LEFT JOIN contract_templates ct ON c.template_id = ct.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get total count for pagination
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM contracts c
      ${whereClause}
    `, params);

    res.json({
      contracts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit),
        totalContracts: countResult.total,
        hasNext: page < Math.ceil(countResult.total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ message: 'Error fetching contracts', error: error.message });
  }
});

// Get contract by ID
router.get('/:id', devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [contract] = await db.query(`
      SELECT 
        c.*,
        ct.name as template_name,
        ct.content as template_content,
        ct.category as template_category
      FROM contracts c
      LEFT JOIN contract_templates ct ON c.template_id = ct.id
      WHERE c.id = ?
    `, [id]);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ message: 'Error fetching contract', error: error.message });
  }
});

// Create new contract
router.post('/', devBypassAdmin, [
  body('title').trim().isLength({ min: 2 }).withMessage('Contract title is required'),
  body('type').trim().isLength({ min: 2 }).withMessage('Contract type is required'),
  body('party_name').trim().isLength({ min: 2 }).withMessage('Party name is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('value').isNumeric().withMessage('Valid contract value is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      type,
      party_name,
      start_date,
      end_date,
      value,
      template_id,
      terms_conditions,
      notes
    } = req.body;

    // Generate contract number
    const contractNumber = `CNT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const result = await db.query(`
      INSERT INTO contracts (
        contract_number, title, type, party_name, start_date, end_date,
        value, template_id, terms_conditions, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      contractNumber, title, type, party_name, start_date, end_date,
      value, template_id || null, terms_conditions || '', notes || ''
    ]);

    const contractId = result.insertId;

    res.status(201).json({
      message: 'Contract created successfully',
      contract: {
        id: contractId,
        contract_number: contractNumber,
        title,
        type,
        party_name,
        start_date,
        end_date,
        value,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ message: 'Error creating contract', error: error.message });
  }
});

// Update contract
router.put('/:id', devBypassAdmin, [
  body('title').optional().trim().isLength({ min: 2 }),
  body('type').optional().trim().isLength({ min: 2 }),
  body('party_name').optional().trim().isLength({ min: 2 }),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('value').optional().isNumeric(),
  body('status').optional().isIn(['pending', 'active', 'expired', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if contract exists
    const [existingContract] = await db.query('SELECT id FROM contracts WHERE id = ?', [id]);
    if (!existingContract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await db.query(`
      UPDATE contracts 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({ message: 'Contract updated successfully' });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ message: 'Error updating contract', error: error.message });
  }
});

// Add digital signature to contract
router.post('/:id/signature', devBypassAdmin, [
  body('signature_data').notEmpty().withMessage('Signature data is required'),
  body('signed_by').trim().isLength({ min: 2 }).withMessage('Signer name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { signature_data, signed_by } = req.body;

    // Check if contract exists
    const [existingContract] = await db.query('SELECT id FROM contracts WHERE id = ?', [id]);
    if (!existingContract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    await db.query(`
      UPDATE contracts 
      SET signature_data = ?, signed_by = ?, signed_at = NOW(), status = 'active'
      WHERE id = ?
    `, [signature_data, signed_by, id]);

    res.json({ message: 'Digital signature added successfully' });
  } catch (error) {
    console.error('Error adding signature:', error);
    res.status(500).json({ message: 'Error adding signature', error: error.message });
  }
});

// Send renewal reminder
router.post('/:id/reminder', devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if contract exists
    const [contract] = await db.query('SELECT * FROM contracts WHERE id = ?', [id]);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Update reminder sent status
    await db.query(`
      UPDATE contracts 
      SET reminder_sent = 1, reminder_sent_at = NOW()
      WHERE id = ?
    `, [id]);

    // Here you would typically send an email notification
    // For now, we'll just log it
    console.log(`Renewal reminder sent for contract: ${contract.title}`);

    res.json({ message: 'Renewal reminder sent successfully' });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ message: 'Error sending reminder', error: error.message });
  }
});

// Get contract templates
router.get('/templates/all', devBypassAdmin, async (req, res) => {
  try {
    const templates = await db.query(`
      SELECT 
        ct.*,
        COUNT(c.id) as usage_count
      FROM contract_templates ct
      LEFT JOIN contracts c ON ct.id = c.template_id
      GROUP BY ct.id
      ORDER BY ct.name ASC
    `);

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
});

// Create contract template
router.post('/templates', devBypassAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Template name is required'),
  body('category').trim().isLength({ min: 2 }).withMessage('Category is required'),
  body('content').trim().isLength({ min: 10 }).withMessage('Template content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, content, description } = req.body;

    const result = await db.query(`
      INSERT INTO contract_templates (name, category, content, description, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [name, category, content, description || '']);

    res.status(201).json({
      message: 'Template created successfully',
      template: {
        id: result.insertId,
        name,
        category,
        content,
        description
      }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
});

// Get contract analytics
router.get('/analytics/overview', devBypassAdmin, async (req, res) => {
  try {
    // Get contract counts by status
    const [statusCounts] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM contracts
      GROUP BY status
    `);

    // Get total contract value
    const [valueResult] = await db.query(`
      SELECT 
        SUM(value) as total_value,
        AVG(value) as average_value,
        COUNT(*) as total_contracts
      FROM contracts
      WHERE status IN ('active', 'pending')
    `);

    // Get expiring contracts (next 30 days)
    const [expiringContracts] = await db.query(`
      SELECT COUNT(*) as expiring_count
      FROM contracts
      WHERE end_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)
      AND end_date > NOW()
      AND status = 'active'
    `);

    // Get digital signature percentage
    const [signatureResult] = await db.query(`
      SELECT 
        COUNT(*) as total_signed,
        (SELECT COUNT(*) FROM contracts WHERE signature_data IS NOT NULL) as digitally_signed
      FROM contracts
      WHERE status = 'active'
    `);

    res.json({
      statusCounts,
      totalValue: valueResult.total_value || 0,
      averageValue: valueResult.average_value || 0,
      totalContracts: valueResult.total_contracts || 0,
      expiringSoon: expiringContracts.expiring_count || 0,
      digitalSignatureRate: signatureResult.total_signed > 0 
        ? Math.round((signatureResult.digitally_signed / signatureResult.total_signed) * 100)
        : 0
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

module.exports = router;

















