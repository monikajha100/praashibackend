const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, devBypass, devBypassAdmin } = require('../middleware/auth');

// Create new order
router.post('/', [
  body('customerName').trim().isLength({ min: 2 }).withMessage('Customer name is required'),
  body('customerEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('customerPhone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('shippingAddress').custom((value) => {
    const address = String(value).trim();
    if (!address || address.length < 3) {
      throw new Error('Shipping address must be at least 3 characters');
    }
    return true;
  }),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').custom((value) => {
    const pincode = String(value).trim();
    if (!pincode || pincode.length < 5 || pincode.length > 6) {
      throw new Error('Valid pincode is required (5-6 digits)');
    }
    if (!/^\d+$/.test(pincode)) {
      throw new Error('Pincode must contain only numbers');
    }
    return true;
  }),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required')
], async (req, res) => {
  try {
    console.log('=== ORDER CREATION REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('=== ORDER VALIDATION ERRORS ===');
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('Order validation passed successfully');

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress,
      city,
      state,
      pincode,
      items,
      paymentMethod = 'cash_on_delivery', // Changed default to match ENUM
      notes
    } = req.body;

    // Validate payment method against allowed ENUM values
    const allowedPaymentMethods = ['cash_on_delivery', 'credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'];
    
    // Map common frontend values to database ENUM values
    const paymentMethodMap = {
      'cod': 'cash_on_delivery',
      'razorpay': 'upi',
      'paypal': 'upi',
      'stripe': 'upi'
    };
    
    // Apply mapping if needed
    const mappedPaymentMethod = paymentMethodMap[paymentMethod] || paymentMethod;
    
    // Validate against allowed values
    const validatedPaymentMethod = allowedPaymentMethods.includes(mappedPaymentMethod) ? mappedPaymentMethod : 'cash_on_delivery';
    
    console.log('Payment method received:', paymentMethod);
    console.log('Payment method mapped:', mappedPaymentMethod);
    console.log('Payment method validated:', validatedPaymentMethod);

    // Generate order number
    const orderNumber = 'ORD-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const [product] = await db.query(
        'SELECT id, name, price FROM products WHERE id = ? AND is_active = 1',
        [item.productId]
      );

      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
      }

      // Use item-level discount if provided (from BOGO offers), otherwise calculate normally
      const itemTotal = item.totalPrice !== undefined 
        ? parseFloat(item.totalPrice) 
        : product.price * item.quantity;
      
      subtotal += itemTotal;

      // Store item-level discount information if available
      const orderItem = {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: item.quantity,
        total_price: itemTotal
      };

      // Add discount information if item has discounts
      if (item.discountedQuantity !== undefined && item.discountedQuantity > 0) {
        orderItem.discounted_quantity = item.discountedQuantity;
        orderItem.discount_per_unit = parseFloat(item.discountPerUnit || 0);
        orderItem.discount_percentage = parseFloat(item.discountPercentage || 0);
      }

      orderItems.push(orderItem);
    }

    // Get coupon discount if provided
    let discountAmount = 0;
    let couponId = null;
    const { couponCode, couponDiscount, discountAmount: orderDiscountAmount } = req.body;
    
    if (orderDiscountAmount || couponDiscount) {
      discountAmount = parseFloat(orderDiscountAmount || couponDiscount || 0);
      // If coupon code is provided, get coupon ID
      if (couponCode) {
        const [coupon] = await db.query('SELECT id FROM coupons WHERE code = ?', [couponCode]);
        if (coupon) {
          couponId = coupon.id;
        }
      }
    }
    
    // Get tax settings
    const taxSettings = await db.query(`
      SELECT setting_key, setting_value
      FROM site_settings
      WHERE setting_key IN ('tax_enabled', 'tax_rate')
    `);
    
    const taxSettingsObj = {
      tax_enabled: 'false',
      tax_rate: '18'
    };
    taxSettings.forEach(setting => {
      taxSettingsObj[setting.setting_key] = setting.setting_value;
    });
    
    const taxEnabled = taxSettingsObj.tax_enabled === 'true';
    const taxRate = parseFloat(taxSettingsObj.tax_rate || '18') / 100;

    // Calculate shipping cost and tax
    const freeShippingThreshold = 999;
    let shippingAmount = subtotal >= freeShippingThreshold ? 0 : 50;
    
    // Apply free shipping coupon if applicable
    if (couponCode) {
      const [coupon] = await db.query('SELECT type FROM coupons WHERE code = ?', [couponCode]);
      if (coupon && coupon.type === 'free_shipping') {
        shippingAmount = 0;
      }
    }
    
    // Calculate tax on subtotal after discount (only if tax is enabled)
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxEnabled ? (taxableAmount * taxRate) : 0;
    const totalAmount = taxableAmount + shippingAmount + taxAmount;

    // Create order
    const orderResult = await db.query(`
      INSERT INTO orders (
        order_number, user_id, status, payment_status, payment_method,
        subtotal, tax_amount, shipping_amount, total_amount, currency,
        customer_name, customer_email, customer_phone,
        shipping_address, billing_address, city, state, pincode, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber, req.user?.userId || null, 'pending', 'pending', validatedPaymentMethod,
      subtotal, taxAmount, shippingAmount, totalAmount, 'INR',
      customerName, customerEmail, customerPhone,
      shippingAddress, billingAddress || shippingAddress, city, state, pincode, notes || ''
    ]);
    
    const orderId = orderResult.insertId;
    
    // Record coupon usage if coupon was applied
    if (couponId && discountAmount > 0 && (req.user?.userId || customerEmail)) {
      try {
        // Get or create user by email for coupon tracking
        let userId = req.user?.userId;
        if (!userId && customerEmail) {
          const [user] = await db.query('SELECT id FROM users WHERE email = ?', [customerEmail]);
          if (user) {
            userId = user.id;
          }
        }
        
        await db.query(`
          INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount, order_total, used_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [couponId, userId, orderId, discountAmount, totalAmount]);
      } catch (couponError) {
        console.error('Error recording coupon usage:', couponError);
        // Don't fail order creation if coupon tracking fails
      }
    }

    // Insert order items
    for (const item of orderItems) {
      // Insert order item with discount information if available
      const discountFields = item.discounted_quantity !== undefined 
        ? ', discounted_quantity, discount_per_unit, discount_percentage'
        : '';
      const discountValues = item.discounted_quantity !== undefined
        ? [item.discounted_quantity, item.discount_per_unit || 0, item.discount_percentage || 0]
        : [];
      
      await db.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, original_price, quantity, total_price${discountFields}) VALUES (?, ?, ?, ?, ?, ?, ?${discountValues.length > 0 ? ', ?, ?, ?' : ''})`,
        [orderId, item.product_id, item.product_name, item.product_price, item.product_price, item.quantity, item.total_price, ...discountValues]
      );
    }

    // Get complete order details
    const [order] = await db.query(`
      SELECT 
        o.*,
        GROUP_CONCAT(
          CONCAT(oi.product_name, ' (Qty: ', oi.quantity, ')')
          SEPARATOR ', '
        ) as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);
    
    console.log('Order query result:', order);
    console.log('Order length:', Array.isArray(order) ? order.length : 'Not an array');

    const orderData = Array.isArray(order) ? order[0] : order;
    console.log('Order data to return:', orderData);

    console.log('Order creation successful, returning:', {
      message: 'Order created successfully',
      order: orderData
    });
    
    res.status(201).json({
      message: 'Order created successfully',
      order: orderData
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: 'Error creating order',
      error: error.message 
    });
  }
});

// Get user orders
router.get('/my-orders', devBypass, async (req, res) => {
  try {
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
    `, [req.user.userId, parseInt(limit), parseInt(offset)]);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get single order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user can access this order
    if (req.user && req.user.role !== 'admin' && order.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get order items
    const orderItems = await db.query(`
      SELECT 
        oi.*,
        p.slug as product_slug,
        pi.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      ...order,
      items: orderItems
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

// Update order status (admin only)
router.put('/:orderId/status', devBypassAdmin, [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;

    const result = await db.query(
      'UPDATE orders SET status = ?, notes = ? WHERE id = ?',
      [status, notes || '', orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// Get all orders (admin only)
router.get('/', devBypassAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const orders = await db.query(`
      SELECT 
        o.*,
        GROUP_CONCAT(
          CONCAT(oi.product_name, ' (Qty: ', oi.quantity, ')')
          SEPARATOR ', '
        ) as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get order with detailed items (admin only)
router.get('/:orderId/items', devBypassAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const [order] = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get order items with product details
    const orderItems = await db.query(`
      SELECT 
        oi.*,
        p.slug as product_slug,
        pi.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `, [orderId]);

    res.json({
      ...order,
      items: orderItems
    });
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ message: 'Error fetching order items' });
  }
});

// Update order payment status (admin only)
router.put('/:orderId/payment-status', devBypassAdmin, [
  body('payment_status').isIn(['pending', 'paid', 'failed', 'refunded', 'partially_refunded'])
    .withMessage('Invalid payment status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { payment_status } = req.body;
    
    console.log('Updating payment status for order:', orderId, 'to:', payment_status);

    const result = await db.query(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      [payment_status, orderId]
    );
    
    console.log('Update result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status' });
  }
});

// Add tracking number (admin only)
router.put('/:orderId/tracking', devBypassAdmin, [
  body('tracking_number').trim().notEmpty().withMessage('Tracking number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { tracking_number } = req.body;

    const result = await db.query(
      'UPDATE orders SET tracking_number = ?, status = "shipped", shipped_at = NOW() WHERE id = ?',
      [tracking_number, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Tracking number added successfully' });
  } catch (error) {
    console.error('Error adding tracking number:', error);
    res.status(500).json({ message: 'Error adding tracking number' });
  }
});

module.exports = router;
