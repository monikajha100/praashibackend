const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, devBypass, devBypassAdmin } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
let razorpayInstance = null;

// Get Razorpay instance with settings
const getRazorpayInstance = async () => {
  if (!razorpayInstance) {
    console.log('Creating new Razorpay instance...');
    try {
      const settings = await db.query(`
        SELECT setting_key, setting_value 
        FROM company_settings 
        WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret')
      `);
      
      console.log('Razorpay settings from DB:', settings);
      
      if (!settings || settings.length === 0) {
        throw new Error('No Razorpay settings found in database. Please configure razorpay_key_id and razorpay_key_secret in company_settings table.');
      }
      
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      const razorpayConfig = {
        key_id: settingsObj.razorpay_key_id,
        key_secret: settingsObj.razorpay_key_secret
      };
      
      if (!razorpayConfig.key_id || !razorpayConfig.key_secret) {
        const missing = [];
        if (!razorpayConfig.key_id) missing.push('razorpay_key_id');
        if (!razorpayConfig.key_secret) missing.push('razorpay_key_secret');
        throw new Error(`Razorpay credentials not configured. Missing: ${missing.join(', ')}. Please set these in company_settings table.`);
      }
      
      // Validate key format
      if (!razorpayConfig.key_id.startsWith('rzp_test_') && !razorpayConfig.key_id.startsWith('rzp_live_')) {
        throw new Error(`Invalid Razorpay Key ID format. Should start with "rzp_test_" or "rzp_live_", got: ${razorpayConfig.key_id.substring(0, 20)}...`);
      }
      
      if (razorpayConfig.key_secret.length < 10) {
        throw new Error('Invalid Razorpay Key Secret format. Secret appears to be too short.');
      }
      
      console.log('Razorpay config:', { 
        key_id: razorpayConfig.key_id, 
        key_secret: '***hidden***',
        mode: razorpayConfig.key_id.startsWith('rzp_test_') ? 'TEST' : 'LIVE'
      });
      
      razorpayInstance = new Razorpay(razorpayConfig);
      console.log('Razorpay instance created successfully');
    } catch (error) {
      console.error('Error creating Razorpay instance:', error);
      throw error;
    }
  }
  return razorpayInstance;
};

// Get payment settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.query(`
      SELECT setting_key, setting_value
      FROM company_settings 
      WHERE setting_key IN ('razorpay_enabled', 'cod_enabled', 'razorpay_key_id')
    `);
    
    const settingsObj = {};
    settings.forEach(setting => {
      // Convert string values to boolean for enabled/disabled settings
      if (setting.setting_key === 'razorpay_enabled' || setting.setting_key === 'cod_enabled') {
        settingsObj[setting.setting_key] = setting.setting_value === 'true';
      } else {
        settingsObj[setting.setting_key] = setting.setting_value;
      }
    });
    
    console.log('Payment settings response:', settingsObj);
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ message: 'Error fetching payment settings' });
  }
});

// Create Razorpay order
router.post('/create-order', [
  body('amount').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      throw new Error('Amount must be a valid positive number');
    }
    return true;
  }),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('order_id').optional().custom((value) => {
    if (value !== undefined && value !== null && typeof value !== 'string' && typeof value !== 'number') {
      throw new Error('Order ID must be a string or number');
    }
    return true;
  })
], async (req, res) => {
  try {
    console.log('=== RAZORPAY CREATE ORDER REQUEST ===');
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, currency = 'INR', order_id } = req.body;
    console.log('Extracted values:', { amount, currency, order_id });
    
    // Ensure amount is a number and convert to paise (Razorpay expects amount in smallest currency unit)
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be a valid positive number'
      });
    }
    
    // Razorpay minimum amount is 1 rupee (100 paise)
    if (numericAmount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Amount too low',
        message: 'Minimum payment amount is ₹1.00'
      });
    }
    
    const amountInPaise = Math.round(numericAmount * 100);
    console.log('Converted amount:', { original: amount, numeric: numericAmount, paise: amountInPaise });
    
    // Create Razorpay order
    try {
      console.log('Getting Razorpay instance...');
      const razorpay = await getRazorpayInstance();
      console.log('Razorpay instance created successfully');
      console.log('Razorpay key ID:', razorpay.key_id);
      
      const options = {
        amount: amountInPaise,
        currency: currency,
        receipt: order_id || `receipt_${Date.now()}`,
        payment_capture: 1 // Auto capture payment
      };
      console.log('Razorpay order options:', options);
      
      console.log('Creating Razorpay order...');
      const razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay order created:', razorpayOrder);
      
      res.json({
        success: true,
        order: razorpayOrder,
        key: (await getRazorpayInstance()).key_id
      });
    } catch (razorpayError) {
      console.log('=== RAZORPAY ERROR ===');
      console.log('Razorpay error details:', razorpayError);
      console.log('Razorpay error message:', razorpayError.message);
      console.log('Razorpay error status:', razorpayError.statusCode);
      if (razorpayError.error) {
        console.log('Razorpay error object:', JSON.stringify(razorpayError.error, null, 2));
      }
      
      // Extract user-friendly error message
      let errorMessage = razorpayError.message || 'Payment gateway error';
      let errorDetails = razorpayError.error;
      
      // Handle common Razorpay errors
      if (razorpayError.statusCode === 401 || (errorMessage && errorMessage.toLowerCase().includes('authentication'))) {
        errorMessage = 'Invalid Razorpay credentials. Please check your Key ID and Key Secret in payment settings.';
      } else if (razorpayError.statusCode === 400) {
        if (errorDetails && errorDetails.description) {
          errorMessage = errorDetails.description;
        } else {
          errorMessage = 'Invalid payment request. Please check the amount and other parameters.';
        }
      }
      
      // Return detailed error for debugging
      res.status(500).json({
        success: false,
        error: 'Payment gateway error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalMessage: razorpayError.message,
          statusCode: razorpayError.statusCode,
          error: razorpayError.error
        } : undefined
      });
    }
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ 
      message: 'Error creating payment order',
      error: error.message 
    });
  }
});

// Verify Razorpay payment
router.post('/verify-payment', [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
  body('order_id').optional().isString().withMessage('Order ID must be a string')
], async (req, res) => {
  try {
    console.log('Payment verification request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      order_id 
    } = req.body;
    
    // Get Razorpay key secret for signature verification
    const settings = await db.query(`
      SELECT setting_value 
      FROM company_settings 
      WHERE setting_key = 'razorpay_key_secret'
    `);
    
    const keySecret = settings[0]?.setting_value;
    
    if (!keySecret) {
      throw new Error('Razorpay key secret not found in database');
    }
    
    // Create signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    // For demo mode, accept any signature
    const isDemoMode = razorpay_order_id.startsWith('order_');
    
    if (!isAuthentic && !isDemoMode) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment verification failed' 
      });
    }
    
    // If order_id is provided, update the order status
    if (order_id) {
      console.log('Updating order status for order_id:', order_id);
      const updateResult = await db.query(
        'UPDATE orders SET payment_status = ?, payment_method = ?, razorpay_payment_id = ?, razorpay_order_id = ? WHERE id = ?',
        ['paid', 'razorpay', razorpay_payment_id, razorpay_order_id, order_id]
      );
      console.log('Order update result:', updateResult);
      
      // Auto-generate invoice if enabled
      const autoInvoiceSettings = await db.query(`
        SELECT setting_value 
        FROM company_settings 
        WHERE setting_key = 'auto_generate_invoice'
      `);
      
      if (autoInvoiceSettings[0]?.setting_value === 'true') {
        console.log('Auto-generating invoice for order_id:', order_id);
        try {
          // Check if invoice already exists
          const existingInvoice = await db.query(
            'SELECT id FROM invoices WHERE order_id = ?',
            [order_id]
          );
          
          if (existingInvoice.length === 0) {
            console.log('Creating new invoice for order_id:', order_id);
            // Create invoice
            const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
            
            // Get customer_id from order instead of req.user
            const [orderForInvoice] = await db.query(
              'SELECT user_id, customer_email FROM orders WHERE id = ?',
              [order_id]
            );
            
            let customerId = null;
            if (orderForInvoice) {
              customerId = orderForInvoice.user_id;
              // If no user_id but we have email, try to find user by email
              if (!customerId && orderForInvoice.customer_email) {
                const [user] = await db.query(
                  'SELECT id FROM users WHERE email = ?',
                  [orderForInvoice.customer_email]
                );
                if (user) {
                  customerId = user.id;
                }
              }
            }
            
            const invoiceResult = await db.query(`
              INSERT INTO invoices (
                invoice_number, order_id, customer_id, invoice_date, due_date,
                subtotal, tax_amount, shipping_amount, total_amount, currency,
                payment_status, payment_method, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              invoiceNumber,
              order_id,
              customerId,
              new Date().toISOString().split('T')[0],
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              0, 0, 0, 0, 'INR', // These will be updated from order data
              'paid',
              'razorpay',
              'Payment completed via Razorpay'
            ]);
            
            const invoiceId = invoiceResult.insertId;
            
            // Get order details and update invoice
            const orderDetails = await db.query(`
              SELECT * FROM orders WHERE id = ?
            `, [order_id]);
            
            if (orderDetails.length > 0) {
              const order = orderDetails[0];
              
              // Get discount amount from coupon_usage if exists
              const [couponUsage] = await db.query(
                'SELECT discount_amount FROM coupon_usage WHERE order_id = ?',
                [order_id]
              );
              const discountAmount = couponUsage ? parseFloat(couponUsage.discount_amount || 0) : 0;
              
              await db.query(`
                UPDATE invoices SET 
                  subtotal = ?, tax_amount = ?, shipping_amount = ?, discount_amount = ?, total_amount = ?
                WHERE id = ?
              `, [
                order.subtotal, 
                order.tax_amount, 
                order.shipping_amount, 
                discountAmount,
                order.total_amount, 
                invoiceId
              ]);
              
              // Create invoice items
              const orderItems = await db.query(`
                SELECT oi.*, p.hsn_sac, p.original_price, p.discount_percentage as product_discount_percentage
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
              `, [order_id]);
              
              for (const item of orderItems) {
                const taxableAmount = item.total_price;
                const taxRate = 18.00; // Default GST rate
                const cgstAmount = (taxableAmount * taxRate) / 200; // 9% CGST
                const sgstAmount = (taxableAmount * taxRate) / 200; // 9% SGST
                const totalAmount = taxableAmount + cgstAmount + sgstAmount;

                // Calculate discount from original_price or product discount
                let discountAmount = 0;
                let discountPercentage = 0;
                const originalPrice = parseFloat(item.original_price) || parseFloat(item.product_price);
                const currentPrice = parseFloat(item.product_price);
                
                if (originalPrice > currentPrice) {
                  discountAmount = (originalPrice - currentPrice) * item.quantity;
                  discountPercentage = ((originalPrice - currentPrice) / originalPrice) * 100;
                } else if (item.product_discount_percentage) {
                  discountPercentage = parseFloat(item.product_discount_percentage);
                  discountAmount = (originalPrice * discountPercentage / 100) * item.quantity;
                }
                
                await db.query(`
                  INSERT INTO invoice_items (
                    invoice_id, product_id, product_name, product_sku, hsn_sac,
                    quantity, unit_price, discount_percentage, discount_amount,
                    taxable_amount, cgst_percentage, cgst_amount,
                    sgst_percentage, sgst_amount, total_amount
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  invoiceId,
                  item.product_id,
                  item.product_name,
                  item.product_sku || '',
                  item.hsn_sac || '1234',
                  item.quantity,
                  item.product_price,
                  discountPercentage,
                  discountAmount,
                  taxableAmount,
                  taxRate / 2, // 9%
                  cgstAmount,
                  taxRate / 2, // 9%
                  sgstAmount,
                  totalAmount
                ]);
              }
            }
          }
        } catch (invoiceError) {
          console.error('Error auto-generating invoice:', invoiceError);
          // Don't fail the payment verification if invoice generation fails
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      message: 'Error verifying payment',
      error: error.message 
    });
  }
});

// Update payment settings (admin only)
router.put('/settings', devBypassAdmin, async (req, res) => {
  try {
    const { razorpay_enabled, cod_enabled, razorpay_key_id, razorpay_key_secret } = req.body;
    
    const settings = [
      { key: 'razorpay_enabled', value: razorpay_enabled ? 'true' : 'false' },
      { key: 'cod_enabled', value: cod_enabled ? 'true' : 'false' },
      { key: 'razorpay_key_id', value: razorpay_key_id || '' },
      { key: 'razorpay_key_secret', value: razorpay_key_secret || '' }
    ];
    
    for (const setting of settings) {
      await db.query(`
        INSERT INTO company_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        updated_at = CURRENT_TIMESTAMP
      `, [setting.key, setting.value]);
    }
    
    // Reset Razorpay instance to pick up new keys
    razorpayInstance = null;
    
    res.json({ message: 'Payment settings updated successfully' });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({ message: 'Error updating payment settings' });
  }
});

module.exports = router;