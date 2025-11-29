const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { devBypass, devBypassAdmin } = require('../middleware/auth');

// ==================== STOCK LEVELS ====================

// Get stock levels for all products
router.get('/stock-levels', devBypass, async (req, res) => {
  try {
    const { product_id, low_stock } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (product_id) {
      whereClause += ' AND sl.product_id = ?';
      params.push(product_id);
    }

    if (low_stock === 'true') {
      whereClause += ' AND sl.current_stock <= sl.min_stock_level';
    }

    const stockLevels = await db.query(`
      SELECT 
        sl.*,
        p.name as product_name,
        p.sku,
        p.price,
        CASE 
          WHEN sl.current_stock <= 0 THEN 'out_of_stock'
          WHEN sl.current_stock <= sl.min_stock_level THEN 'low_stock'
          WHEN sl.current_stock <= sl.reorder_point THEN 'reorder_point'
          ELSE 'in_stock'
        END as stock_status
      FROM stock_levels sl
      JOIN products p ON sl.product_id = p.id
      ${whereClause}
      ORDER BY p.name ASC
    `, params);

    res.json(stockLevels);
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({ message: 'Error fetching stock levels', error: error.message });
  }
});

// Update stock levels
router.put('/stock-levels/:productId', devBypass, devBypassAdmin, [
  body('current_stock').isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
  body('min_stock_level').isInt({ min: 0 }).withMessage('Min stock level must be a non-negative integer'),
  body('max_stock_level').isInt({ min: 0 }).withMessage('Max stock level must be a non-negative integer'),
  body('reorder_point').isInt({ min: 0 }).withMessage('Reorder point must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.params;
    const { current_stock, min_stock_level, max_stock_level, reorder_point } = req.body;

    // Check if stock level exists
    const existingStock = await db.query(
      'SELECT id FROM stock_levels WHERE product_id = ?',
      [productId]
    );

    if (existingStock.length === 0) {
      // Create new stock level
      await db.query(
        'INSERT INTO stock_levels (product_id, current_stock, min_stock_level, max_stock_level, reorder_point) VALUES (?, ?, ?, ?, ?)',
        [productId, current_stock, min_stock_level, max_stock_level, reorder_point]
      );
    } else {
      // Update existing stock level
      await db.query(
        'UPDATE stock_levels SET current_stock = ?, min_stock_level = ?, max_stock_level = ?, reorder_point = ? WHERE product_id = ?',
        [current_stock, min_stock_level, max_stock_level, reorder_point, productId]
      );
    }

    // Check for low stock alerts
    await checkLowStockAlerts(productId, current_stock, min_stock_level);

    res.json({ message: 'Stock level updated successfully' });
  } catch (error) {
    console.error('Error updating stock level:', error);
    res.status(500).json({ message: 'Error updating stock level', error: error.message });
  }
});

// ==================== STOCK MOVEMENTS ====================

// Get stock movements
router.get('/stock-movements', devBypass, async (req, res) => {
  try {
    const { product_id, movement_type, date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (product_id) {
      whereClause += ' AND sm.product_id = ?';
      params.push(product_id);
    }

    if (movement_type) {
      whereClause += ' AND sm.movement_type = ?';
      params.push(movement_type);
    }

    if (date_from) {
      whereClause += ' AND DATE(sm.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(sm.created_at) <= ?';
      params.push(date_to);
    }

    const movements = await db.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku,
        u.name as user_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    res.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ message: 'Error fetching stock movements', error: error.message });
  }
});

// Create stock movement
router.post('/stock-movements', devBypass, devBypassAdmin, [
  body('product_id').isInt().withMessage('Product ID is required'),
  body('movement_type').isIn(['in', 'out', 'transfer', 'adjustment', 'return']).withMessage('Invalid movement type'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reference_type').isIn(['purchase', 'sale', 'transfer', 'adjustment', 'return', 'initial']).withMessage('Invalid reference type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      product_id, 
      movement_type, 
      quantity, 
      reference_type, 
      reference_id, 
      reference_number, 
      notes, 
      user_id 
    } = req.body;

    // Create stock movement record
    const movementResult = await db.query(
      'INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, reference_number, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [product_id, movement_type, quantity, reference_type, reference_id || null, reference_number || null, notes || null, user_id || null]
    );

    // Update stock level
    const stockChange = movement_type === 'in' || movement_type === 'return' ? quantity : -quantity;
    
    // Check if stock level exists
    const existingStock = await db.query(
      'SELECT id, current_stock FROM stock_levels WHERE product_id = ?',
      [product_id]
    );

    if (existingStock.length === 0) {
      // Create new stock level
      await db.query(
        'INSERT INTO stock_levels (product_id, current_stock, min_stock_level) VALUES (?, ?, 0)',
        [product_id, Math.max(0, stockChange), 0]
      );
    } else {
      // Update existing stock level
      const newStock = Math.max(0, existingStock[0].current_stock + stockChange);
      await db.query(
        'UPDATE stock_levels SET current_stock = ? WHERE product_id = ?',
        [newStock, product_id]
      );

      // Check for low stock alerts
      const stockLevel = await db.query(
        'SELECT min_stock_level FROM stock_levels WHERE product_id = ?',
        [product_id]
      );
      
      if (stockLevel.length > 0) {
        await checkLowStockAlerts(product_id, newStock, stockLevel[0].min_stock_level);
      }
    }

    res.status(201).json({ 
      message: 'Stock movement created successfully', 
      movementId: movementResult.insertId
    });

  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ message: 'Error creating stock movement', error: error.message });
  }
});

// ==================== STOCK ADJUSTMENTS ====================

// Get stock adjustments
router.get('/stock-adjustments', devBypass, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND sa.status = ?';
      params.push(status);
    }

    const adjustments = await db.query(`
      SELECT 
        sa.*,
        p.name as product_name,
        p.sku,
        u.name as user_name,
        approver.name as approved_by_name
      FROM stock_adjustments sa
      JOIN products p ON sa.product_id = p.id
      JOIN users u ON sa.user_id = u.id
      LEFT JOIN users approver ON sa.approved_by = approver.id
      ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    res.json(adjustments);
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    res.status(500).json({ message: 'Error fetching stock adjustments', error: error.message });
  }
});

// Create stock adjustment
router.post('/stock-adjustments', devBypass, devBypassAdmin, [
  body('product_id').isInt().withMessage('Product ID is required'),
  body('adjustment_type').isIn(['increase', 'decrease', 'set']).withMessage('Invalid adjustment type'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reason').isIn(['damage', 'theft', 'found', 'correction', 'other']).withMessage('Invalid reason'),
  body('user_id').isInt().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, adjustment_type, quantity, reason, notes, user_id } = req.body;

    // Generate adjustment number
    const adjustmentNumber = 'ADJ' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    const result = await db.query(
      'INSERT INTO stock_adjustments (adjustment_number, product_id, adjustment_type, quantity, reason, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [adjustmentNumber, product_id, adjustment_type, quantity, reason, notes || null, user_id]
    );

    res.status(201).json({ 
      message: 'Stock adjustment created successfully', 
      adjustmentId: result.insertId,
      adjustmentNumber: adjustmentNumber
    });
  } catch (error) {
    console.error('Error creating stock adjustment:', error);
    res.status(500).json({ message: 'Error creating stock adjustment', error: error.message });
  }
});

// Approve stock adjustment
router.put('/stock-adjustments/:adjustmentId/approve', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { adjustmentId } = req.params;
    const { approved_by } = req.body;

    // Get adjustment details
    const adjustment = await db.query(
      'SELECT * FROM stock_adjustments WHERE id = ? AND status = "pending"',
      [adjustmentId]
    );

    if (adjustment.length === 0) {
      return res.status(404).json({ message: 'Adjustment not found or already processed' });
    }

    const adj = adjustment[0];

    // Calculate new stock level
    let newStock = 0;
    const currentStock = await db.query(
      'SELECT current_stock FROM stock_levels WHERE product_id = ?',
      [adj.product_id]
    );

    if (currentStock.length > 0) {
      const current = currentStock[0].current_stock;
      switch (adj.adjustment_type) {
        case 'increase':
          newStock = current + adj.quantity;
          break;
        case 'decrease':
          newStock = Math.max(0, current - adj.quantity);
          break;
        case 'set':
          newStock = adj.quantity;
          break;
      }
    } else {
      newStock = adj.adjustment_type === 'set' ? adj.quantity : adj.quantity;
    }

    // Update stock level
    if (currentStock.length > 0) {
      await db.query(
        'UPDATE stock_levels SET current_stock = ? WHERE product_id = ?',
        [newStock, adj.product_id]
      );
    } else {
      await db.query(
        'INSERT INTO stock_levels (product_id, current_stock, min_stock_level) VALUES (?, ?, 0)',
        [adj.product_id, newStock, 0]
      );
    }

    // Create stock movement record
    await db.query(
      'INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, reference_number, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [adj.product_id, 'adjustment', adj.quantity, 'adjustment', adj.id, adj.adjustment_number, `Stock adjustment: ${adj.reason}`, approved_by]
    );

    // Update adjustment status
    await db.query(
      'UPDATE stock_adjustments SET status = "approved", approved_by = ?, approved_at = NOW() WHERE id = ?',
      [approved_by, adjustmentId]
    );

    res.json({ message: 'Stock adjustment approved successfully' });

  } catch (error) {
    console.error('Error approving stock adjustment:', error);
    res.status(500).json({ message: 'Error approving stock adjustment', error: error.message });
  }
});

// ==================== LOW STOCK ALERTS ====================

// Get low stock alerts
router.get('/low-stock-alerts', devBypass, async (req, res) => {
  try {
    const { is_resolved } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (is_resolved !== undefined) {
      whereClause += ' AND lsa.is_resolved = ?';
      params.push(is_resolved === 'true' ? 1 : 0);
    }

    const alerts = await db.query(`
      SELECT 
        lsa.*,
        p.name as product_name,
        p.sku,
        resolver.name as resolved_by_name
      FROM low_stock_alerts lsa
      JOIN products p ON lsa.product_id = p.id
      LEFT JOIN users resolver ON lsa.resolved_by = resolver.id
      ${whereClause}
      ORDER BY lsa.created_at DESC
    `, params);

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ message: 'Error fetching low stock alerts', error: error.message });
  }
});

// Resolve low stock alert
router.put('/low-stock-alerts/:alertId/resolve', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolved_by } = req.body;

    await db.query(
      'UPDATE low_stock_alerts SET is_resolved = TRUE, resolved_at = NOW(), resolved_by = ? WHERE id = ?',
      [resolved_by, alertId]
    );

    res.json({ message: 'Low stock alert resolved successfully' });
  } catch (error) {
    console.error('Error resolving low stock alert:', error);
    res.status(500).json({ message: 'Error resolving low stock alert', error: error.message });
  }
});

// ==================== INVENTORY REPORTS ====================

// Get inventory summary
router.get('/reports/summary', devBypass, async (req, res) => {
  try {
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(sl.current_stock) as total_stock,
        SUM(sl.current_stock * p.price) as total_value,
        COUNT(CASE WHEN sl.current_stock <= 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN sl.current_stock <= sl.min_stock_level AND sl.current_stock > 0 THEN 1 END) as low_stock_count
      FROM stock_levels sl
      JOIN products p ON sl.product_id = p.id
    `);

    res.json(summary[0] || {});
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({ message: 'Error fetching inventory summary', error: error.message });
  }
});

// Helper function to check and create low stock alerts
async function checkLowStockAlerts(productId, currentStock, minStockLevel) {
  try {
    // Check if there's already an unresolved alert
    const existingAlert = await db.query(
      'SELECT id FROM low_stock_alerts WHERE product_id = ? AND is_resolved = FALSE',
      [productId]
    );

    let alertType = null;
    if (currentStock <= 0) {
      alertType = 'out_of_stock';
    } else if (currentStock <= minStockLevel) {
      alertType = 'low_stock';
    }

    if (alertType && existingAlert.length === 0) {
      // Create new alert
      await db.query(
        'INSERT INTO low_stock_alerts (product_id, current_stock, min_stock_level, alert_type) VALUES (?, ?, ?, ?)',
        [productId, currentStock, minStockLevel, alertType]
      );
    } else if (!alertType && existingAlert.length > 0) {
      // Resolve existing alerts if stock is now sufficient
      await db.query(
        'UPDATE low_stock_alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE product_id = ? AND is_resolved = FALSE',
        [productId]
      );
    }
  } catch (error) {
    console.error('Error checking low stock alerts:', error);
  }
}

module.exports = router;
