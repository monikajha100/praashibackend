const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all users (admin only) - temporarily without auth
router.get('/', async (req, res) => {
  try {
    console.log('=== GET ALL USERS (ADMIN) ===');
    console.log('Query params:', req.query);
    
    const { page = 1, limit = 20, search, role } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitValue = parseInt(limit) || 20;
    const offsetValue = (pageNum - 1) * limitValue;

    let whereClause = '';
    let params = [];

    if (role) {
      whereClause += ' WHERE role = ?';
      params.push(role);
    }

    if (search) {
      const searchCondition = ' (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      if (whereClause) {
        whereClause += ' AND' + searchCondition;
      } else {
        whereClause += ' WHERE' + searchCondition;
      }
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM users${whereClause}`;
    const countParams = params.length > 0 ? params : [];
    const [countResult] = await db.query(countQuery, countParams);
    const totalUsers = countResult?.total || 0;

    // Build the main query with proper parameter handling
    const usersQuery = `
      SELECT id, name, email, phone, role, is_active, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Ensure all parameters are properly typed
    const queryParams = [...params, limitValue, offsetValue];
    
    console.log('Query:', usersQuery);
    console.log('Params:', queryParams);
    console.log('Params count:', queryParams.length);
    
    const users = await db.query(usersQuery, queryParams);

    console.log('✅ Found', users.length, 'users out of', totalUsers, 'total');
    console.log('First user sample:', users[0] ? {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      role: users[0].role,
      is_active: users[0].is_active
    } : 'No users found');

    // Return users array directly (axios will wrap it in response.data)
    res.json(users || []);
  } catch (error) {
    console.error('=== GET ALL USERS ERROR ===');
    console.error('Error fetching users:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Create new user (admin only)
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number'),
  body('role').isIn(['user', 'admin']).withMessage('Valid role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, role = 'user', address, city, state, pincode } = req.body;

    // Check if email already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Generate a temporary password (user will need to reset it)
    const tempPassword = 'temp' + Math.random().toString(36).substr(2, 8);

    // Ensure all values are properly set
    const finalPhone = phone || null;
    const finalAddress = address || null;
    const finalCity = city || null;
    const finalState = state || null;
    const finalPincode = pincode || null;

    const result = await db.query(
      'INSERT INTO users (name, email, phone, role, address, city, state, pincode, password, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, finalPhone, role, finalAddress, finalCity, finalState, finalPincode, tempPassword, true]
    );

    res.status(201).json({ 
      message: 'User created successfully', 
      userId: result.insertId,
      tempPassword: tempPassword // In production, send this via email
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Get user by ID (admin only) - temporarily without auth
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await db.query(
      'SELECT id, name, email, phone, address, city, state, pincode, role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user status (admin only) - temporarily without auth
router.put('/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    const result = await db.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

// Get user orders (admin only)
router.get('/:userId/orders', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const orders = await db.query(`
      SELECT 
        o.*,
        GROUP_CONCAT(
          CONCAT(oi.product_name, ' (Qty: ', oi.quantity, ')')
          SEPARATOR ', '
        ) as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching user orders', error: error.message });
  }
});

module.exports = router;
