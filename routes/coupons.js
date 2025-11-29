const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, devBypass, devBypassAdmin } = require('../middleware/auth');

// Helper function to transform coupon from DB to API format
const transformCouponFromDB = (coupon) => {
  if (!coupon) return null;
  return {
    ...coupon,
    status: coupon.is_active === 1 || coupon.is_active === true ? 'active' : 'inactive',
    max_discount: coupon.max_discount_amount || null,
    target_audience: coupon.applicable_users ? JSON.parse(coupon.applicable_users) : 'all',
    used_count: coupon.usage_count || 0,
    usedCount: coupon.usage_count || 0
  };
};

// Helper function to transform coupon from API to DB format
const transformCouponToDB = (coupon) => {
  const dbCoupon = { ...coupon };
  if (dbCoupon.status !== undefined) {
    dbCoupon.is_active = dbCoupon.status === 'active' ? 1 : 0;
    delete dbCoupon.status;
  }
  if (dbCoupon.max_discount !== undefined) {
    dbCoupon.max_discount_amount = dbCoupon.max_discount;
    delete dbCoupon.max_discount;
  }
  if (dbCoupon.target_audience !== undefined) {
    if (dbCoupon.target_audience === 'all') {
      dbCoupon.applicable_users = null;
    } else {
      dbCoupon.applicable_users = JSON.stringify([dbCoupon.target_audience]);
    }
    delete dbCoupon.target_audience;
  }
  delete dbCoupon.used_count;
  delete dbCoupon.usedCount;
  return dbCoupon;
};

// Get all coupons (admin only)
router.get('/', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause += ' AND c.is_active = 1';
      } else if (status === 'inactive') {
        whereClause += ' AND c.is_active = 0';
      } else if (status === 'expired') {
        whereClause += ' AND c.end_date < NOW()';
      }
    }

    if (type && type !== 'all') {
      whereClause += ' AND c.type = ?';
      params.push(type);
    }

    if (search) {
      whereClause += ' AND (c.code LIKE ? OR c.name LIKE ? OR c.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const couponsResult = await db.query(`
      SELECT 
        c.*,
        COALESCE(c.usage_count, 0) as usage_count,
        COALESCE(COUNT(cu.id), 0) as usage_from_table
      FROM coupons c
      LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Transform coupons to API format
    const coupons = Array.isArray(couponsResult) 
      ? couponsResult.map(transformCouponFromDB)
      : [transformCouponFromDB(couponsResult)].filter(Boolean);

    // Get total count for pagination
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM coupons c
      ${whereClause}
    `, params);

    const total = Array.isArray(countResult) && countResult.length > 0 
      ? countResult[0].total 
      : countResult?.total || 0;

    res.json({
      coupons,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCoupons: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
});

// Get coupon by code (public endpoint for checkout)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { userId, orderAmount } = req.query;

    console.log('=== COUPON VALIDATION REQUEST ===');
    console.log('Code:', code);
    console.log('Order Amount:', orderAmount);
    console.log('User ID:', userId);

    if (!code || code.trim() === '') {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon code is required' 
      });
    }

    // Query coupon - handle both array and object returns
    const couponResult = await db.query(`
      SELECT 
        c.*,
        COALESCE(COUNT(cu.id), 0) as used_count
      FROM coupons c
      LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
      WHERE c.code = ? AND c.is_active = 1
      AND (c.start_date IS NULL OR c.start_date <= NOW())
      AND (c.end_date IS NULL OR c.end_date >= NOW())
      GROUP BY c.id
    `, [code.trim().toUpperCase()]);

    // Handle different database return formats
    const couponRaw = Array.isArray(couponResult) && couponResult.length > 0 
      ? couponResult[0] 
      : couponResult;

    if (!couponRaw || !couponRaw.id) {
      console.log('Coupon not found for code:', code);
      return res.status(404).json({ 
        valid: false, 
        message: 'Invalid or expired coupon code' 
      });
    }

    const coupon = transformCouponFromDB(couponRaw);

    console.log('Coupon found:', {
      id: coupon.id,
      code: coupon.code,
      status: coupon.status,
      used_count: coupon.used_count,
      usage_limit: coupon.usage_limit
    });

    // Check usage limit
    const usedCount = parseInt(coupon.used_count || coupon.usage_count || 0);
    const usageLimit = parseInt(coupon.usage_limit || 999999);
    if (usedCount >= usageLimit) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon usage limit exceeded' 
      });
    }

    // Check minimum order amount
    const orderAmt = parseFloat(orderAmount || 0);
    const minOrderAmt = parseFloat(coupon.min_order_amount || 0);
    if (orderAmount && orderAmt < minOrderAmt) {
      return res.status(400).json({ 
        valid: false, 
        message: `Minimum order amount of ₹${minOrderAmt} required` 
      });
    }

    // Check if this is a welcome/first purchase coupon and if user has already used it
    const couponCodeUpper = code.toUpperCase();
    const isWelcomeCoupon = couponCodeUpper.includes('WELCOME') || 
                           (coupon.name && coupon.name.toLowerCase().includes('welcome')) ||
                           (coupon.description && coupon.description.toLowerCase().includes('first purchase'));
    
    if (isWelcomeCoupon && userId) {
      // Check if user has already used this coupon
      const usageCheckResult = await db.query(
        'SELECT * FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
        [coupon.id, userId]
      );
      
      const usageCheck = Array.isArray(usageCheckResult) && usageCheckResult.length > 0
        ? usageCheckResult[0]
        : usageCheckResult;
      
      if (usageCheck) {
        return res.status(400).json({ 
          valid: false, 
          message: 'Welcome offer can only be used on your first purchase. You have already used this coupon.' 
        });
      }
      
      // Also check if user has any completed orders (first purchase check)
      const ordersResult = await db.query(
        'SELECT COUNT(*) as order_count FROM orders WHERE user_id = ? AND status IN (?, ?, ?)',
        [userId, 'delivered', 'confirmed', 'processing']
      );
      
      const ordersData = Array.isArray(ordersResult) && ordersResult.length > 0
        ? ordersResult[0]
        : ordersResult;
      
      const orderCount = parseInt(ordersData?.order_count || 0);
      if (orderCount > 0) {
        return res.status(400).json({ 
          valid: false, 
          message: 'Welcome offer can only be used on your first purchase. You have already placed an order.' 
        });
      }
    }

    // Check target audience (check applicable_users)
    const applicableUsers = couponRaw.applicable_users 
      ? (typeof couponRaw.applicable_users === 'string' ? JSON.parse(couponRaw.applicable_users) : couponRaw.applicable_users)
      : null;
    
    if (applicableUsers && applicableUsers.length > 0 && userId) {
      const userResult = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const user = Array.isArray(userResult) && userResult.length > 0 
        ? userResult[0] 
        : userResult;
        
      if (user) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const userCreatedAt = user.created_at ? new Date(user.created_at) : null;
        const isNewCustomer = userCreatedAt && userCreatedAt > thirtyDaysAgo;
        const isVipCustomer = user.is_vip === 1 || user.is_vip === true || user.is_vip === '1';
        
        const targetType = applicableUsers[0];
        if (targetType === 'new_customers' && !isNewCustomer) {
          return res.status(400).json({ 
            valid: false, 
            message: 'This coupon is only for new customers' 
          });
        }
        
        if (targetType === 'vip_customers' && !isVipCustomer) {
          return res.status(400).json({ 
            valid: false, 
            message: 'This coupon is only for VIP customers' 
          });
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    const couponType = coupon.type || 'fixed';
    const couponValue = parseFloat(coupon.value || 0);
    
    if (couponType === 'percentage') {
      discountAmount = (orderAmt * couponValue) / 100;
      const maxDiscount = parseFloat(coupon.max_discount || coupon.max_discount_amount || 0);
      if (maxDiscount > 0 && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = couponValue;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmt);
    discountAmount = Math.max(0, discountAmount);

    console.log('Validation successful. Discount amount:', discountAmount);

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name || coupon.code,
        type: couponType,
        value: couponValue,
        discount_amount: discountAmount,
        max_discount: parseFloat(coupon.max_discount || coupon.max_discount_amount || 0),
        min_order_amount: minOrderAmt,
        description: coupon.description || ''
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      valid: false,
      message: 'Error validating coupon. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply coupon to order
router.post('/apply', [
  body('code').trim().isLength({ min: 1 }).withMessage('Coupon code is required'),
  body('orderId').isInt().withMessage('Valid order ID is required'),
  body('userId').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, orderId, userId } = req.body;

    // Get order details
    const orderResult = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const order = Array.isArray(orderResult) && orderResult.length > 0 
      ? orderResult[0] 
      : orderResult;
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate coupon
    const couponResult = await db.query(`
      SELECT 
        c.*,
        COUNT(cu.id) as used_count
      FROM coupons c
      LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
      WHERE c.code = ? AND c.is_active = 1
      AND c.start_date <= NOW() AND c.end_date >= NOW()
      GROUP BY c.id
    `, [code]);

    const couponRaw = Array.isArray(couponResult) && couponResult.length > 0 
      ? couponResult[0] 
      : couponResult;
      
    if (!couponRaw) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }

    const coupon = transformCouponFromDB(couponRaw);

    // Check if already used for this order
    const existingUsageResult = await db.query(
      'SELECT * FROM coupon_usage WHERE coupon_id = ? AND order_id = ?',
      [coupon.id, orderId]
    );
    
    const existingUsage = Array.isArray(existingUsageResult) && existingUsageResult.length > 0
      ? existingUsageResult[0]
      : existingUsageResult;

    if (existingUsage) {
      return res.status(400).json({ message: 'Coupon already applied to this order' });
    }

    // Check usage limit
    if (coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'Coupon usage limit exceeded' });
    }

    // Check minimum order amount
    if (order.total_amount < coupon.min_order_amount) {
      return res.status(400).json({ 
        message: `Minimum order amount of ₹${coupon.min_order_amount} required` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (order.total_amount * coupon.value) / 100;
      const maxDiscount = parseFloat(coupon.max_discount || coupon.max_discount_amount || 0);
      if (maxDiscount > 0 && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // Apply discount to order
    const newTotal = Math.max(0, order.total_amount - discountAmount);
    
    await db.query(`
      UPDATE orders 
      SET discount_amount = ?, total_amount = ?, updated_at = NOW()
      WHERE id = ?
    `, [discountAmount, newTotal, orderId]);

    // Record coupon usage
    await db.query(`
      INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount, used_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [coupon.id, userId, orderId, discountAmount]);

    // Update usage count in coupons table
    await db.query(`
      UPDATE coupons 
      SET usage_count = COALESCE(usage_count, 0) + 1
      WHERE id = ?
    `, [coupon.id]);

    res.json({
      message: 'Coupon applied successfully',
      discount: {
        amount: discountAmount,
        new_total: newTotal,
        coupon_code: coupon.code,
        coupon_name: coupon.name
      }
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ message: 'Error applying coupon', error: error.message });
  }
});

// Create new coupon
router.post('/', devBypass, devBypassAdmin, [
  body('code').trim().isLength({ min: 3 }).withMessage('Coupon code must be at least 3 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Coupon name is required'),
  body('type').isIn(['percentage', 'fixed']).withMessage('Invalid coupon type'),
  body('value').isFloat({ min: 0 }).withMessage('Valid discount value is required'),
  body('min_order_amount').isFloat({ min: 0 }).withMessage('Valid minimum order amount is required'),
  body('usage_limit').isInt({ min: 1 }).withMessage('Valid usage limit is required'),
  body('start_date').custom((value) => {
    // Accept both ISO8601 and YYYY-MM-DD formats
    if (!value) return false;
    const dateStr = value.toString();
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(dateStr) && !dateOnlyRegex.test(dateStr)) {
      throw new Error('Valid start date is required');
    }
    return true;
  }),
  body('end_date').custom((value) => {
    // Accept both ISO8601 and YYYY-MM-DD formats
    if (!value) return false;
    const dateStr = value.toString();
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(dateStr) && !dateOnlyRegex.test(dateStr)) {
      throw new Error('Valid end date is required');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      name,
      type,
      value,
      min_order_amount,
      max_discount,
      usage_limit,
      start_date,
      end_date,
      target_audience,
      description
    } = req.body;

    // Validate required fields
    if (!code || !name || !type || value === undefined || !usage_limit || !start_date || !end_date) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        errors: [{ msg: 'Please fill in all required fields' }]
      });
    }

    // Validate numeric values
    const numValue = parseFloat(value);
    const numMinOrder = parseFloat(min_order_amount || 0);
    const numUsageLimit = parseInt(usage_limit);
    
    if (isNaN(numValue) || numValue < 0) {
      return res.status(400).json({ message: 'Invalid discount value' });
    }
    if (isNaN(numMinOrder) || numMinOrder < 0) {
      return res.status(400).json({ message: 'Invalid minimum order amount' });
    }
    if (isNaN(numUsageLimit) || numUsageLimit < 1) {
      return res.status(400).json({ message: 'Invalid usage limit' });
    }

    // Validate dates
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    if (isNaN(startDateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid start date' });
    }
    if (isNaN(endDateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid end date' });
    }
    if (endDateObj < startDateObj) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check if coupon code already exists (case-insensitive check)
    const couponCodeUpper = code.trim().toUpperCase();
    const existingResult = await db.query(
      'SELECT id FROM coupons WHERE UPPER(TRIM(code)) = ?', 
      [couponCodeUpper]
    );
    
    // Handle mysql2 result format - pool.execute returns rows array
    // If no results, it's an empty array []
    const existingCoupon = Array.isArray(existingResult) && existingResult.length > 0
      ? existingResult[0]
      : (existingResult && existingResult.id ? existingResult : null);
    
    console.log('Checking coupon code:', couponCodeUpper);
    console.log('Existing result:', existingResult);
    console.log('Existing coupon:', existingCoupon);
      
    if (existingCoupon && existingCoupon.id) {
      return res.status(400).json({ 
        message: `Coupon code "${couponCodeUpper}" already exists`,
        code: couponCodeUpper
      });
    }

    // Transform data for database
    // Convert date strings to proper datetime format
    let formattedStartDate = null;
    let formattedEndDate = null;
    
    if (start_date) {
      if (start_date.includes('T') || start_date.includes(' ')) {
        // Already has time component
        formattedStartDate = start_date.split('T')[0] + ' 00:00:00';
      } else {
        // Date only, add time
        formattedStartDate = `${start_date} 00:00:00`;
      }
    }
    
    if (end_date) {
      if (end_date.includes('T') || end_date.includes(' ')) {
        // Already has time component
        formattedEndDate = end_date.split('T')[0] + ' 23:59:59';
      } else {
        // Date only, add time
        formattedEndDate = `${end_date} 23:59:59`;
      }
    }

    const dbData = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      value: numValue,
      min_order_amount: numMinOrder,
      max_discount_amount: max_discount && max_discount !== '' ? parseFloat(max_discount) : null,
      usage_limit: numUsageLimit,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      is_active: 1,
      description: description || '',
      applicable_users: target_audience && target_audience !== 'all' 
        ? JSON.stringify([target_audience]) 
        : null
    };

    const result = await db.query(`
      INSERT INTO coupons (
        code, name, type, value, min_order_amount, max_discount_amount,
        usage_limit, start_date, end_date, applicable_users,
        description, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dbData.code,
      dbData.name,
      dbData.type,
      dbData.value,
      dbData.min_order_amount,
      dbData.max_discount_amount,
      dbData.usage_limit,
      dbData.start_date,
      dbData.end_date,
      dbData.applicable_users,
      dbData.description,
      dbData.is_active
    ]);

    // Handle mysql2 result format - pool.execute returns [ResultSetHeader, fields]
    const insertResult = Array.isArray(result) ? result[0] : result;
    const couponId = insertResult.insertId || insertResult.insertid;

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: {
        id: couponId,
        code: dbData.code,
        name: dbData.name
      }
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
});

// Update coupon
router.put('/:id', devBypass, devBypassAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('type').optional().isIn(['percentage', 'fixed']),
  body('value').optional().isFloat({ min: 0 }),
  body('min_order_amount').optional().isFloat({ min: 0 }),
  body('usage_limit').optional().isInt({ min: 1 }),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('status').optional().isIn(['active', 'inactive', 'expired'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if coupon exists
    const couponResult = await db.query('SELECT id FROM coupons WHERE id = ?', [id]);
    const existingCoupon = Array.isArray(couponResult) && couponResult.length > 0 
      ? couponResult[0] 
      : couponResult;
      
    if (!existingCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Transform update data for database
    const dbUpdateData = transformCouponToDB(updateData);

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(dbUpdateData).forEach(key => {
      if (dbUpdateData[key] !== undefined && key !== 'id' && dbUpdateData[key] !== null) {
        if (key === 'start_date' && dbUpdateData[key]) {
          updateFields.push(`${key} = ?`);
          const dateValue = dbUpdateData[key];
          if (typeof dateValue === 'string' && !dateValue.includes('T') && !dateValue.includes(' ')) {
            updateValues.push(`${dateValue} 00:00:00`);
          } else {
            updateValues.push(dateValue);
          }
        } else if (key === 'end_date' && dbUpdateData[key]) {
          updateFields.push(`${key} = ?`);
          const dateValue = dbUpdateData[key];
          if (typeof dateValue === 'string' && !dateValue.includes('T') && !dateValue.includes(' ')) {
            updateValues.push(`${dateValue} 23:59:59`);
          } else {
            updateValues.push(dateValue);
          }
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(dbUpdateData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateValues.push(id);

    const updateResult = await db.query(`
      UPDATE coupons 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // Handle mysql2 result format
    const updateResultData = Array.isArray(updateResult) ? updateResult[0] : updateResult;
    const affectedRows = updateResultData.affectedRows || updateResultData.affectedrows || 0;

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Coupon not found or no changes made' });
    }

    res.json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
});

// Delete coupon
router.delete('/:id', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const couponResult = await db.query('SELECT id, code FROM coupons WHERE id = ?', [id]);
    const coupon = Array.isArray(couponResult) && couponResult.length > 0 
      ? couponResult[0] 
      : couponResult;
      
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if coupon has been used
    const usageResult = await db.query('SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?', [id]);
    const usageCount = Array.isArray(usageResult) && usageResult.length > 0 
      ? usageResult[0].count 
      : usageResult?.count || 0;

    if (parseInt(usageCount) > 0) {
      // Soft delete - just mark as inactive instead of hard delete
      const deactivateResult = await db.query(`
        UPDATE coupons 
        SET is_active = 0, updated_at = NOW()
        WHERE id = ?
      `, [id]);
      
      const deactivateResultData = Array.isArray(deactivateResult) ? deactivateResult[0] : deactivateResult;
      const affectedRows = deactivateResultData.affectedRows || deactivateResultData.affectedrows || 0;
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
      
      return res.json({ 
        message: 'Coupon deactivated successfully (cannot delete used coupons)',
        deactivated: true
      });
    }

    // Hard delete if never used
    const deleteResult = await db.query('DELETE FROM coupons WHERE id = ?', [id]);
    const deleteResultData = Array.isArray(deleteResult) ? deleteResult[0] : deleteResult;
    const deletedRows = deleteResultData.affectedRows || deleteResultData.affectedrows || 0;

    if (deletedRows === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
});

// Toggle coupon status
router.patch('/:id/toggle-status', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== TOGGLE COUPON STATUS ===');
    console.log('Coupon ID:', id);

    // Check if coupon exists
    const couponResult = await db.query('SELECT id, is_active FROM coupons WHERE id = ?', [id]);
    const coupon = Array.isArray(couponResult) && couponResult.length > 0 
      ? couponResult[0] 
      : couponResult;
      
    if (!coupon || !coupon.id) {
      console.log('Coupon not found');
      return res.status(404).json({ message: 'Coupon not found' });
    }

    console.log('Current is_active:', coupon.is_active);
    console.log('Type of is_active:', typeof coupon.is_active);

    // Toggle status - handle both 0/1 and boolean values
    const currentIsActive = coupon.is_active === 1 || coupon.is_active === true || coupon.is_active === '1';
    const newIsActive = currentIsActive ? 0 : 1;
    const newStatus = newIsActive === 1 ? 'active' : 'inactive';

    console.log('New is_active:', newIsActive);
    console.log('New status:', newStatus);

    await db.query(`
      UPDATE coupons 
      SET is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [newIsActive, id]);

    console.log('Coupon status updated successfully');

    res.json({ 
      message: `Coupon ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      status: newStatus
    });
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error toggling coupon status', error: error.message });
  }
});

// Get coupon usage history (admin only)
router.get('/usage', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, couponId, userId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (couponId) {
      whereClause += ' AND cu.coupon_id = ?';
      params.push(couponId);
    }

    if (userId) {
      whereClause += ' AND cu.user_id = ?';
      params.push(userId);
    }

    const usageHistory = await db.query(`
      SELECT 
        cu.*,
        c.code as coupon_code,
        c.name as coupon_name,
        o.order_number,
        o.total_amount as order_total,
        u.email as user_email,
        u.name as user_name
      FROM coupon_usage cu
      LEFT JOIN coupons c ON cu.coupon_id = c.id
      LEFT JOIN orders o ON cu.order_id = o.id
      LEFT JOIN users u ON cu.user_id = u.id
      ${whereClause}
      ORDER BY cu.used_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM coupon_usage cu
      ${whereClause}
    `, params);

    const total = Array.isArray(countResult) && countResult.length > 0 
      ? countResult[0].total 
      : countResult?.total || 0;

    res.json({
      usageHistory: Array.isArray(usageHistory) ? usageHistory : [usageHistory].filter(Boolean),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsage: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching coupon usage:', error);
    res.status(500).json({ message: 'Error fetching coupon usage', error: error.message });
  }
});

// Get coupon analytics
router.get('/analytics/overview', devBypass, devBypassAdmin, async (req, res) => {
  try {
    // Get coupon counts by status
    const statusCountsResult = await db.query(`
      SELECT 
        CASE 
          WHEN is_active = 1 AND end_date >= NOW() THEN 'active'
          WHEN is_active = 0 THEN 'inactive'
          WHEN end_date < NOW() THEN 'expired'
          ELSE 'inactive'
        END as status,
        COUNT(*) as count
      FROM coupons
      GROUP BY status
    `);

    const statusCounts = Array.isArray(statusCountsResult) ? statusCountsResult : [statusCountsResult].filter(Boolean);

    // Get total usage statistics
    const usageStatsResult = await db.query(`
      SELECT 
        COUNT(*) as total_usage,
        SUM(discount_amount) as total_discount_given,
        AVG(discount_amount) as avg_discount_per_use
      FROM coupon_usage
    `);

    const usageStats = Array.isArray(usageStatsResult) && usageStatsResult.length > 0
      ? usageStatsResult[0]
      : usageStatsResult;

    // Get expiring coupons (next 7 days)
    const expiringResult = await db.query(`
      SELECT COUNT(*) as expiring_count
      FROM coupons
      WHERE end_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
      AND end_date > NOW()
      AND is_active = 1
    `);

    const expiringCoupons = Array.isArray(expiringResult) && expiringResult.length > 0
      ? expiringResult[0]
      : expiringResult;

    // Get most used coupons
    const topCouponsResult = await db.query(`
      SELECT 
        c.code,
        c.name,
        COUNT(cu.id) as usage_count,
        SUM(cu.discount_amount) as total_discount
      FROM coupons c
      LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
      GROUP BY c.id
      ORDER BY usage_count DESC
      LIMIT 5
    `);

    const topCoupons = Array.isArray(topCouponsResult) ? topCouponsResult : [topCouponsResult].filter(Boolean);

    res.json({
      statusCounts,
      totalUsage: usageStats?.total_usage || 0,
      totalDiscountGiven: usageStats?.total_discount_given || 0,
      averageDiscountPerUse: usageStats?.avg_discount_per_use || 0,
      expiringSoon: expiringCoupons?.expiring_count || 0,
      topCoupons
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get campaigns
router.get('/campaigns/all', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const campaigns = await db.query(`
      SELECT 
        c.*,
        COUNT(cp.coupon_id) as coupon_count,
        COALESCE(SUM(cu.discount_amount), 0) as total_discount_given
      FROM campaigns c
      LEFT JOIN campaign_coupons cp ON c.id = cp.campaign_id
      LEFT JOIN coupon_usage cu ON cp.coupon_id = cu.coupon_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json(Array.isArray(campaigns) ? campaigns : [campaigns].filter(Boolean));
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
  }
});

// Create campaign
router.post('/campaigns', devBypass, devBypassAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Campaign name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Campaign description is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('target_audience').isIn(['all', 'new_customers', 'vip_customers', 'returning_customers']).withMessage('Invalid target audience')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, start_date, end_date, target_audience, coupon_ids } = req.body;

    const result = await db.query(`
      INSERT INTO campaigns (name, description, start_date, end_date, target_audience, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', NOW())
    `, [name, description, start_date, end_date, target_audience]);

    const campaignId = result.insertId;

    // Associate coupons with campaign
    if (coupon_ids && coupon_ids.length > 0) {
      for (const couponId of coupon_ids) {
        await db.query(`
          INSERT INTO campaign_coupons (campaign_id, coupon_id, created_at)
          VALUES (?, ?, NOW())
        `, [campaignId, couponId]);
      }
    }

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: {
        id: campaignId,
        name,
        description,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Error creating campaign', error: error.message });
  }
});

module.exports = router;
