process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, devBypass, devBypassAdmin } = require('../middleware/auth');
// const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
//xsmtpsib-c572fbad3e03d1100383aa15f97ec30a3b1cb6d087c3d8cf2c28cf73a1adf6b1-fopKvEt4V6R8zYcb
// Email configuration
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 30000, // 30 sec
  greetingTimeout: 30000,
  socketTimeout: 30000
});



// Get all invoices (admin only)
router.get('/', devBypassAdmin, async (req, res) => {
  try {
    console.log('=== GET ALL INVOICES (ADMIN) ===');
    console.log('Query params:', req.query);
    
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND i.payment_status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (i.invoice_number LIKE ? OR o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    console.log('WHERE clause:', whereClause);
    console.log('Query params:', params);
    console.log('Pagination - page:', page, 'limit:', limit, 'offset:', offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT i.id) as total
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      LEFT JOIN users u ON i.customer_id = u.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalInvoices = (countResult && countResult[0] && countResult[0].total) || 0;

    // Try to get invoices with item count, but handle if invoice_items table doesn't exist
    let invoices;
    try {
      invoices = await db.query(`
        SELECT 
          i.*,
          o.order_number,
          COALESCE(u.name, o.customer_name) as customer_name,
          COALESCE(u.email, o.customer_email) as customer_email,
          COUNT(ii.id) as item_count
        FROM invoices i
        LEFT JOIN orders o ON i.order_id = o.id
        LEFT JOIN users u ON i.customer_id = u.id
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        ${whereClause}
        GROUP BY i.id
        ORDER BY i.created_at DESC
       
      `, [...params]);
    } catch (error) {
      // If invoice_items table doesn't exist, query without it
      if (error.message && (error.message.includes('invoice_items') || error.message.includes("doesn't exist") || error.message.includes('Unknown table'))) {
        console.log('⚠️ invoice_items table not found, querying without item count');
        invoices = await db.query(`
          SELECT 
            i.*,
            o.order_number,
            COALESCE(u.name, o.customer_name) as customer_name,
            COALESCE(u.email, o.customer_email) as customer_email,
            0 as item_count
          FROM invoices i
          LEFT JOIN orders o ON i.order_id = o.id
          LEFT JOIN users u ON i.customer_id = u.id
          ${whereClause}
          ORDER BY i.created_at DESC
          LIMIT ? OFFSET ?
        `, [...params, parseInt(limit, 10), parseInt(offset, 10)]);
      } else {
        throw error;
      }
    }

    console.log('✅ Found', invoices.length, 'invoices out of', totalInvoices, 'total');
    console.log('First invoice sample:', invoices[0] ? {
      id: invoices[0].id,
      invoice_number: invoices[0].invoice_number,
      customer_name: invoices[0].customer_name,
      customer_email: invoices[0].customer_email,
      total_amount: invoices[0].total_amount,
      payment_status: invoices[0].payment_status
    } : 'No invoices found');

    res.json(invoices);
  } catch (error) {
    console.error('=== GET ALL INVOICES ERROR ===');
    console.error('Error fetching invoices:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

// Get customer invoices
router.get('/my-invoices', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get user email to also match invoices by order email
    const userResult = await db.query('SELECT email FROM users WHERE id = ?', [req.user.userId]);
    const user = userResult && userResult[0] ? userResult[0] : null;
    const userEmail = user?.email;

    // Try to get invoices with item count, but handle if invoice_items table doesn't exist
    let invoices;
    try {
      invoices = await db.query(`
        SELECT 
          i.*,
          o.order_number,
          COUNT(ii.id) as item_count
        FROM invoices i
        LEFT JOIN orders o ON i.order_id = o.id
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE i.customer_id = ? 
           OR (i.customer_id IS NULL AND o.customer_email = ?)
        GROUP BY i.id
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?
      `, [req.user.userId, userEmail || '', parseInt(limit, 10), parseInt(offset, 10)]);
    } catch (error) {
      // If invoice_items table doesn't exist, query without it
      if (error.message && (error.message.includes('invoice_items') || error.message.includes("doesn't exist") || error.message.includes('Unknown table'))) {
        console.log('⚠️ invoice_items table not found, querying without item count');
        invoices = await db.query(`
          SELECT 
            i.*,
            o.order_number,
            0 as item_count
          FROM invoices i
          LEFT JOIN orders o ON i.order_id = o.id
          WHERE i.customer_id = ? 
             OR (i.customer_id IS NULL AND o.customer_email = ?)
          ORDER BY i.created_at DESC
          LIMIT ? OFFSET ?
        `, [req.user.userId, userEmail || '', parseInt(limit, 10), parseInt(offset, 10)]);
      } else {
        throw error;
      }
    }

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Get invoice by order ID
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get invoice by order_id
    const invoices = await db.query(`
      SELECT 
        i.id,
        i.invoice_number,
        i.order_id,
        i.customer_id
      FROM invoices i
      WHERE i.order_id = ?
    `, [orderId]);

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found for this order' });
    }

    const invoice = invoices[0];

    // Check if user can access this invoice
    if (req.user && req.user.role !== 'admin' && invoice.customer_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ invoice_id: invoice.id, invoice_number: invoice.invoice_number });
  } catch (error) {
    console.error('Error fetching invoice by order ID:', error);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
});

// Get single invoice details
router.get('/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice details
    const invoiceResult = await db.query(`
      SELECT 
        i.*,
        o.order_number,
        o.status as order_status,
        o.shipping_address,
        o.payment_status as order_payment_status,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        u.state as customer_state,
        u.address as customer_address,
        u.city as customer_city,
        u.pincode as customer_pincode
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      LEFT JOIN users u ON i.customer_id = u.id
      WHERE i.id = ?
    `, [invoiceId]);
    
    const invoice = invoiceResult && invoiceResult[0] ? invoiceResult[0] : null;
    
    // Calculate received_amount based on payment_status
    if (invoice && invoice.payment_status === 'paid') {
      invoice.received_amount = invoice.total_amount;
    } else {
      invoice.received_amount = 0;
    }

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user can access this invoice
    if (req.user && req.user.role !== 'admin' && invoice.customer_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get invoice items - handle if invoice_items table doesn't exist
    let invoiceItems = [];
    try {
      invoiceItems = await db.query(`
        SELECT 
          ii.*,
          p.slug as product_slug,
          pi.image_url as product_image
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
        WHERE ii.invoice_id = ?
        ORDER BY ii.id
      `, [invoiceId]);
    } catch (error) {
      // If invoice_items table doesn't exist, try to get items from order_items instead
      if (error.message && (error.message.includes('invoice_items') || error.message.includes("doesn't exist") || error.message.includes('Unknown table'))) {
        console.log('⚠️ invoice_items table not found, trying to get items from order');
        if (invoice && invoice.order_id) {
          try {
            const orderItems = await db.query(`
              SELECT 
                oi.*,
                oi.product_name,
                oi.product_price as unit_price,
                oi.quantity,
                oi.total_price as total_amount,
                p.slug as product_slug,
                pi.image_url as product_image
              FROM order_items oi
              LEFT JOIN products p ON oi.product_id = p.id
              LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
              WHERE oi.order_id = ?
              ORDER BY oi.id
            `, [invoice.order_id]);
            // Map order items to invoice items format
            invoiceItems = orderItems.map(item => ({
              ...item,
              product_sku: item.product_sku || '',
              hsn_sac: null,
              discount_percentage: 0,
              discount_amount: 0,
              taxable_amount: item.total_price,
              cgst_percentage: 0,
              cgst_amount: 0,
              sgst_percentage: 0,
              sgst_amount: 0
            }));
          } catch (orderError) {
            console.log('⚠️ Could not get items from order either:', orderError.message);
            invoiceItems = [];
          }
        }
      } else {
        throw error;
      }
    }

    // Get company settings - use latest company information
    const companySettings = await db.query(`
      SELECT setting_key, setting_value, setting_type
      FROM company_settings
    `);

    const settings = {};
    companySettings.forEach(setting => {
      if (setting.setting_type === 'json') {
        settings[setting.setting_key] = JSON.parse(setting.setting_value);
      } else {
        settings[setting.setting_key] = setting.setting_value;
      }
    });

    // Override with latest company information
    const latestCompanyInfo = {
      company_name: 'Praashibysupal',
      company_address: '203 SF Anikedhya Capital -2, Nr Mahalaxmi Cross Road, Paldi, Ahmedabad, Gujarat, India - 380006',
      company_phone: '+91 87806 06280',
      company_email: 'hello@praashibysupal.co.in',
      company_state: 'Gujarat',
      company_logo: '/logo.png',
      invoice_terms: 'Thanks for doing business with us!'
    };

    res.json({
      ...invoice,
      items: invoiceItems,
      company: { ...settings, ...latestCompanyInfo }
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ message: 'Error fetching invoice details' });
  }
});

// Create invoice for order (admin only)
router.post('/create/:orderId', devBypassAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if invoice already exists
    const existingInvoice = await db.query(
      'SELECT id FROM invoices WHERE order_id = ?',
      [orderId]
    );

    if (existingInvoice && existingInvoice.length > 0) {
      return res.status(400).json({ message: 'Invoice already exists for this order' });
    }

    // Get order details
    const orderResult = await db.query(`
      SELECT o.*, u.id as customer_id
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    const order = orderResult && orderResult[0] ? orderResult[0] : null;

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Create invoice
    const invoiceResult = await db.query(`
      INSERT INTO invoices (
        invoice_number, order_id, customer_id, invoice_date, due_date,
        subtotal, tax_amount, shipping_amount, total_amount, currency,
        payment_status, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNumber,
      order.id,
      order.customer_id,
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      order.subtotal,
      order.tax_amount,
      order.shipping_amount,
      order.total_amount,
      'INR',
      order.payment_status === 'paid' ? 'paid' : 'pending',
      order.payment_method,
      order.notes || 'Thank you for your business!'
    ]);

    const invoiceId = invoiceResult.insertId;

    // Get order items and create invoice items
    const orderItems = await db.query(`
      SELECT oi.*, p.hsn_sac, p.original_price, p.discount_percentage as product_discount_percentage
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

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

    res.status(201).json({
      message: 'Invoice created successfully',
      invoiceId,
      invoiceNumber
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
});

// Send invoice via email (admin only)
router.post('/:invoiceId/send-email', devBypassAdmin, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice details
    const invoiceResult = await db.query(`
      SELECT 
        i.*,
        o.order_number,
        u.name as customer_name,
        u.email as customer_email
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      LEFT JOIN users u ON i.customer_id = u.id
      WHERE i.id = ?
    `, [invoiceId]);

    const invoice = invoiceResult && invoiceResult[0] ? invoiceResult[0] : null;

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.customer_email) {
      return res.status(400).json({ message: 'Customer email not found' });
    }

    // Get company settings
    const companySettings = await db.query(`
      SELECT setting_key, setting_value, setting_type
      FROM company_settings
    `);

    const settings = {};
    companySettings.forEach(setting => {
      if (setting.setting_type === 'json') {
        settings[setting.setting_key] = JSON.parse(setting.setting_value);
      } else {
        settings[setting.setting_key] = setting.setting_value;
      }
    });

    // Email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .invoice-details { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .amount { font-size: 18px; font-weight: bold; color: #28a745; }
          .footer { margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Invoice ${invoice.invoice_number}</h2>
            <p>Dear ${invoice.customer_name},</p>
            <p>Thank you for your business! Please find your invoice attached below.</p>
          </div>
          
          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Order Number:</strong> ${invoice.order_number}</p>
            <p><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> <span class="amount">₹${invoice.total_amount}</span></p>
            <p><strong>Payment Status:</strong> ${invoice.payment_status}</p>
          </div>
          
          <div class="footer">
            <p>For any queries, please contact us at ${settings.company_email}</p>
            <p>Thank you for choosing ${settings.company_name}!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: settings.company_email,
      to: invoice.customer_email,
      subject: `Invoice ${invoice.invoice_number} - ${settings.company_name}`,
      html: emailHtml
    };

    await transporter.sendMail(mailOptions);

    // Update invoice email status
    await db.query(
      'UPDATE invoices SET email_sent = TRUE, email_sent_at = NOW() WHERE id = ?',
      [invoiceId]
    );

    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Error sending invoice email' });
  }
});

// Update invoice payment status (admin only)
router.put('/:invoiceId/payment-status', devBypassAdmin, [
  body('payment_status').isIn(['pending', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid payment status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { invoiceId } = req.params;
    const { payment_status, payment_date } = req.body;

    const result = await db.query(
      'UPDATE invoices SET payment_status = ?, payment_date = ? WHERE id = ?',
      [payment_status, payment_date || null, invoiceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status' });
  }
});

// Get company settings (admin only)
router.get('/admin/company-settings', devBypassAdmin, async (req, res) => {
  try {
    const settings = await db.query(`
      SELECT setting_key, setting_value, setting_type, description
      FROM company_settings
      ORDER BY setting_key
    `);

    const formattedSettings = {};
    settings.forEach(setting => {
      if (setting.setting_type === 'json') {
        formattedSettings[setting.setting_key] = JSON.parse(setting.setting_value);
      } else {
        formattedSettings[setting.setting_key] = setting.setting_value;
      }
    });

    res.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: 'Error fetching company settings' });
  }
});

// Update company settings (admin only)
router.put('/admin/company-settings', devBypassAdmin, async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      const settingType = typeof value === 'object' ? 'json' : 'text';
      const settingValue = settingType === 'json' ? JSON.stringify(value) : value;

      await db.query(`
        INSERT INTO company_settings (setting_key, setting_value, setting_type)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        setting_type = VALUES(setting_type),
        updated_at = CURRENT_TIMESTAMP
      `, [key, settingValue, settingType]);
    }

    res.json({ message: 'Company settings updated successfully' });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: 'Error updating company settings' });
  }
});

module.exports = router;
