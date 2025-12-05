const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, User } = require('../models');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

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
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required')
], async (req, res) => {
  try {
    console.log('=== SEQUELIZE ORDER CREATION REQUEST ===');
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
      items,
      paymentMethod = 'razorpay',
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
      notes,
      offerId
    } = req.body;

    // Determine user_id - use authenticated user if available, otherwise find or create user by email
    let userId = req.user?.userId || null;
    let wasNewUserCreated = false;
    
    if (!userId) {
      // Check if user exists with this email
      let user = await User.findOne({ where: { email: customerEmail } });
      
      if (!user) {
        // Create new user account with email as username and mobile number as password
        console.log(`Creating new user account for email: ${customerEmail}`);
        
        // Hash the mobile number to use as password
        // Normalize phone number: remove spaces, dashes, parentheses for consistent storage
        const mobileNumberAsPassword = customerPhone.toString().trim().replace(/[\s\-\(\)]/g, '');
        const hashedPassword = await bcrypt.hash(mobileNumberAsPassword, 12);
        
        // Create user
        user = await User.create({
          name: customerName,
          email: customerEmail,
          password: hashedPassword,
          phone: customerPhone,
          role: 'user',
          is_active: true
        });
        
        wasNewUserCreated = true;
        console.log(`✅ User account created successfully: ${user.email} (ID: ${user.id})`);
        console.log(`📱 Login credentials - Email: ${customerEmail}, Password: ${mobileNumberAsPassword}`);
        console.log(`   ⚠️  Note: Password stored is normalized (no spaces/dashes). Use digits only for login.`);
      } else {
        console.log(`User already exists with email: ${customerEmail} (ID: ${user.id})`);
      }
      
      userId = user.id;
    }

    // Generate order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now()}`;

    // Create order
    const order = await Order.create({
      order_number: orderNumber,
      user_id: userId,
      status: 'pending',
      payment_status: 'pending',
      payment_method: paymentMethod,
      subtotal: parseFloat(subtotal),
      tax_amount: parseFloat(taxAmount),
      shipping_amount: parseFloat(shippingAmount),
      total_amount: parseFloat(totalAmount),
      currency: 'INR',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
      notes: notes || '',
      offer_id: offerId ? parseInt(offerId) : null
    });

    console.log(`Order created with ID: ${order.id}`);

    // Create order items with stock validation
    const orderItems = [];
    const stockErrors = [];
    
    for (const item of items) {
      // Get product details including stock
      const product = await Product.findOne({
        where: { 
          id: item.productId,
          is_active: true 
        },
        attributes: ['id', 'name', 'price', 'stock_quantity']
      });

      if (!product) {
        console.error(`Product not found: ${item.productId}`);
        stockErrors.push(`Product "${item.productId}" not found or inactive`);
        continue;
      }

      // Check stock availability
      const requestedQuantity = parseInt(item.quantity);
      const availableStock = parseInt(product.stock_quantity || 0);
      
      if (availableStock < requestedQuantity) {
        const errorMsg = availableStock === 0 
          ? `Product "${product.name}" is out of stock`
          : `Only ${availableStock} unit(s) available for "${product.name}". You requested ${requestedQuantity}`;
        stockErrors.push(errorMsg);
        console.error(`Stock validation failed: ${errorMsg}`);
        continue;
      }

      // Create order item
      const orderItem = await OrderItem.create({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_price: parseFloat(product.price),
        original_price: parseFloat(product.price),
        quantity: requestedQuantity,
        total_price: parseFloat(product.price) * requestedQuantity
      });

      orderItems.push(orderItem);
      
      // Update product stock (decrement)
      await Product.update(
        { stock_quantity: availableStock - requestedQuantity },
        { where: { id: product.id } }
      );
      
      console.log(`Stock updated for product ${product.id}: ${availableStock} -> ${availableStock - requestedQuantity}`);
    }

    // If there are stock errors, rollback the order
    if (stockErrors.length > 0) {
      console.error('Stock validation errors:', stockErrors);
      // Delete the order and order items
      await OrderItem.destroy({ where: { order_id: order.id } });
      await Order.destroy({ where: { id: order.id } });
      
      return res.status(400).json({
        success: false,
        errors: stockErrors.map(msg => ({ msg })),
        message: stockErrors.length === 1 ? stockErrors[0] : 'Some products are out of stock or insufficient quantity available'
      });
    }

    // Validate that we have at least one order item
    if (orderItems.length === 0) {
      await Order.destroy({ where: { id: order.id } });
      return res.status(400).json({
        success: false,
        message: 'No valid items in order'
      });
    }

    console.log(`Created ${orderItems.length} order items`);

    // Get order with items for response
    const orderWithItems = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ]
    });

    // Create items summary
    const itemsSummary = orderItems.map(item => 
      `${item.product_name} (Qty: ${item.quantity})`
    ).join(', ');

    // Return account info if user was newly created
    const userAccountInfo = wasNewUserCreated ? {
      account_created: true,
      login_email: customerEmail,
      login_password: customerPhone.toString().trim(),
      message: `Account created! You can login with email: ${customerEmail} and password: ${customerPhone.toString().trim()}`
    } : {
      account_created: false
    };

    console.log('Order creation successful');
    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...orderWithItems.toJSON(),
        items_summary: itemsSummary
      },
      ...userAccountInfo
    });
  } catch (error) {
    console.error('=== SEQUELIZE ORDER CREATION ERROR ===');
    console.error('Error creating order:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error creating order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    console.log('=== SEQUELIZE GET USER ORDERS ===');
    console.log('Request user:', req.user);
    console.log('User ID:', req.user?.userId);
    
    if (!req.user || !req.user.userId) {
      console.log('Authentication failed: No user or userId');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.userId;
    console.log(`Fetching orders for user_id: ${userId}`);

    const orders = await Order.findAll({
      where: { user_id: userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          required: false, // LEFT JOIN to include orders even without items
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'primary_image'],
              required: false
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`Found ${orders.length} orders for user ${userId}`);

    // Get all invoice IDs for these orders in one query
    const orderIds = orders.map(o => o.id);
    const invoiceMap = {};
    
    if (orderIds.length > 0) {
      const { sequelize } = require('../config/sequelize');
      const invoiceResults = await sequelize.query(`
        SELECT id, invoice_number, order_id 
        FROM invoices 
        WHERE order_id IN (:orderIds)
      `, {
        replacements: { orderIds },
        type: sequelize.QueryTypes.SELECT
      });
      
      invoiceResults.forEach(inv => {
        invoiceMap[inv.order_id] = {
          invoice_id: inv.id,
          invoice_number: inv.invoice_number
        };
      });
    }

    // Transform orders to include items_summary and invoice info
    const ordersWithSummary = orders.map(order => {
      const orderData = order.toJSON();
      
      // Create items summary from order items
      if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
        orderData.items_summary = orderData.items.map(item => 
          `${item.product_name} (Qty: ${item.quantity})`
        ).join(', ');
      } else {
        orderData.items_summary = 'No items';
      }
      
      // Add invoice info if exists
      if (invoiceMap[orderData.id]) {
        orderData.invoice_id = invoiceMap[orderData.id].invoice_id;
        orderData.invoice_number = invoiceMap[orderData.id].invoice_number;
      }
      
      return orderData;
    });

    console.log(`Returning ${ordersWithSummary.length} orders with summaries`);
    res.json(ordersWithSummary);
  } catch (error) {
    console.error('=== SEQUELIZE GET USER ORDERS ERROR ===');
    console.error('Error fetching user orders:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    console.log('=== SEQUELIZE GET SINGLE ORDER ===');
    
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'primary_image', 'sku']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user can access this order
    if (req.user && req.user.userId !== order.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Transform order to include flattened product image for each item
    const orderData = order.toJSON();
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items = orderData.items.map(item => {
        const itemData = { ...item };
        // Flatten product image to item level for easier frontend access
        if (item.product) {
          itemData.product_image = item.product.primary_image || null;
          itemData.product_sku = item.product.sku || null;
        }
        return itemData;
      });
    }

    // Check if invoice exists for this order
    const { sequelize } = require('../config/sequelize');
    const invoiceResults = await sequelize.query(`
      SELECT id, invoice_number 
      FROM invoices 
      WHERE order_id = :orderId
      LIMIT 1
    `, {
      replacements: { orderId: orderData.id },
      type: sequelize.QueryTypes.SELECT
    });

    if (invoiceResults && invoiceResults.length > 0) {
      orderData.invoice_id = invoiceResults[0].id;
      orderData.invoice_number = invoiceResults[0].invoice_number;
    }

    console.log(`Found order: ${order.order_number}`);
    res.json(orderData);
  } catch (error) {
    console.error('=== SEQUELIZE GET SINGLE ORDER ERROR ===');
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Update order status (admin only)
router.put('/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('payment_status').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status')
], async (req, res) => {
  try {
    console.log('=== SEQUELIZE UPDATE ORDER STATUS ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, payment_status, tracking_number } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = { status };
    if (payment_status) updateData.payment_status = payment_status;
    if (tracking_number) updateData.tracking_number = tracking_number;

    // Set timestamps for status changes
    if (status === 'shipped') {
      updateData.shipped_at = new Date();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date();
    }

    await order.update(updateData);

    console.log(`Updated order ${order.order_number} status to: ${status}`);
    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('=== SEQUELIZE UPDATE ORDER STATUS ERROR ===');
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// Get all orders (admin only)
router.get('/admin/all', async (req, res) => {
  try {
    console.log('=== SEQUELIZE GET ALL ORDERS (ADMIN) ===');
    console.log('Query params:', req.query);
    
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause properly for Sequelize
    const whereConditions = {};
    
    // Build conditions array for combining with AND
    const conditions = [];
    
    if (status) {
      conditions.push({ status: status });
    }
    
    // Add search functionality
    if (search) {
      conditions.push({
        [Op.or]: [
          { order_number: { [Op.like]: `%${search}%` } },
          { customer_name: { [Op.like]: `%${search}%` } },
          { customer_email: { [Op.like]: `%${search}%` } }
        ]
      });
    }
    
    // Combine all conditions with AND if multiple, otherwise use single condition
    if (conditions.length > 1) {
      whereConditions[Op.and] = conditions;
    } else if (conditions.length === 1) {
      Object.assign(whereConditions, conditions[0]);
    }

    try {
      console.log('Where conditions:', JSON.stringify(whereConditions, null, 2));
    } catch (e) {
      console.log('Where conditions:', whereConditions);
    }
    console.log('Pagination - page:', page, 'limit:', limit, 'offset:', offset);

    // Define attributes to select, excluding offer_id if it doesn't exist in DB
    const orderAttributes = [
      'id', 'order_number', 'user_id', 'status', 'payment_status', 'payment_method',
      'subtotal', 'tax_amount', 'shipping_amount', 'total_amount', 'currency',
      'customer_name', 'customer_email', 'customer_phone',
      'shipping_address', 'billing_address', 'notes',
      'tracking_number', 'shipped_at', 'delivered_at',
      'razorpay_payment_id', 'razorpay_order_id',
      'created_at', 'updated_at'
      // Note: offer_id excluded - add it if your database has this column
    ];

    const queryOptions = {
      attributes: orderAttributes,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false // LEFT JOIN instead of INNER JOIN
        },
        {
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'product_name', 'quantity', 'total_price'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true // Use distinct when using includes to get accurate count
    };

    // Only add where clause if we have conditions
    if (Object.keys(whereConditions).length > 0) {
      queryOptions.where = whereConditions;
    }

    const { count, rows: orders } = await Order.findAndCountAll(queryOptions);

    // Format orders to ensure customer_name and customer_email are always present
    const formattedOrders = orders.map(order => {
      const orderData = order.toJSON();
      // Ensure customer_name and customer_email are present (from order or user)
      if (!orderData.customer_name && orderData.user) {
        orderData.customer_name = orderData.user.name || orderData.customer_name;
      }
      if (!orderData.customer_email && orderData.user) {
        orderData.customer_email = orderData.user.email || orderData.customer_email;
      }
      return orderData;
    });

    console.log(`✅ Found ${formattedOrders.length} orders out of ${count} total`);
    console.log('First order sample:', formattedOrders[0] ? {
      id: formattedOrders[0].id,
      order_number: formattedOrders[0].order_number,
      customer_name: formattedOrders[0].customer_name,
      customer_email: formattedOrders[0].customer_email,
      total_amount: formattedOrders[0].total_amount,
      status: formattedOrders[0].status,
      payment_status: formattedOrders[0].payment_status
    } : 'No orders found');

    const response = {
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };

    console.log('Response summary:', {
      ordersCount: response.orders.length,
      totalOrders: response.pagination.totalOrders,
      currentPage: response.pagination.currentPage
    });

    res.json(response);
  } catch (error) {
    console.error('=== SEQUELIZE GET ALL ORDERS ERROR ===');
    console.error('Error fetching all orders:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
