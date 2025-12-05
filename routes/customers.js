const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { devBypassAdmin } = require('../middleware/auth');

// Get all customers from orders with their orders, login details, and invoices
router.get('/', devBypassAdmin, async (req, res) => {
  try {
    console.log('=== GET ALL CUSTOMERS (ADMIN) ===');
    console.log('Query params:', req.query);
    
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitValue = parseInt(limit) || 20;
    const offsetValue = (pageNum - 1) * limitValue;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = `
        WHERE (
          o.customer_email LIKE ? OR 
          o.customer_name LIKE ? OR 
          o.customer_phone LIKE ? OR
          u.email LIKE ? OR
          u.name LIKE ?
        )
      `;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // First, get all unique customers from orders
    const customersQuery = `
      SELECT DISTINCT
        COALESCE(u.id, NULL) as user_id,
        COALESCE(u.email, o.customer_email) as email,
        COALESCE(u.name, o.customer_name) as name,
        COALESCE(u.phone, o.customer_phone) as phone,
        u.is_active,
        u.created_at as user_created_at,
        o.customer_email as order_email,
        o.customer_name as order_name,
        o.customer_phone as order_phone
      FROM orders o
      LEFT JOIN users u ON u.email = o.customer_email
      ${whereClause}
      ORDER BY COALESCE(u.created_at, o.created_at) DESC
      LIMIT ? OFFSET ?
    `;

    // Ensure all parameters are properly typed integers
    const queryParams = [...params, limitValue, offsetValue];
    
    console.log('Customers query:', customersQuery);
    console.log('Query params:', queryParams);
    
    const customers = await db.query(customersQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT COALESCE(u.id, o.customer_email)) as total
      FROM orders o
      LEFT JOIN users u ON u.email = o.customer_email
      ${whereClause}
    `;
    
    const [countResult] = await db.query(countQuery, params);
    const totalCustomers = countResult.total;

    // For each customer, get their orders and invoices
    const customersWithDetails = await Promise.all(
      customers.map(async (customer) => {
        const customerEmail = customer.email || customer.order_email;
        
        // Get all orders for this customer with full details
        const orders = await db.query(`
          SELECT 
            id,
            order_number,
            status,
            payment_status,
            payment_method,
            subtotal,
            tax_amount,
            shipping_amount,
            total_amount,
            currency,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            billing_address,
            tracking_number,
            notes,
            created_at,
            updated_at,
            shipped_at,
            delivered_at
          FROM orders
          WHERE customer_email = ?
          ORDER BY created_at DESC
        `, [customerEmail]);

        // Get all invoices for this customer
        // First try by customer_id (if user exists)
        let invoices = [];
        if (customer.user_id) {
          invoices = await db.query(`
            SELECT 
              i.id,
              i.invoice_number,
              i.order_id,
              i.invoice_date,
              i.total_amount,
              i.currency,
              i.payment_status,
              i.payment_method,
              i.created_at,
              o.order_number
            FROM invoices i
            LEFT JOIN orders o ON i.order_id = o.id
            WHERE i.customer_id = ?
            ORDER BY i.created_at DESC
          `, [customer.user_id]);
        }
        
        // Also get invoices by order_id where customer_email matches
        const invoicesByEmail = await db.query(`
          SELECT 
            i.id,
            i.invoice_number,
            i.order_id,
            i.invoice_date,
            i.total_amount,
            i.currency,
            i.payment_status,
            i.payment_method,
            i.created_at,
            o.order_number
          FROM invoices i
          INNER JOIN orders o ON i.order_id = o.id
          WHERE o.customer_email = ?
            AND (i.customer_id IS NULL OR i.customer_id != ?)
          ORDER BY i.created_at DESC
        `, [customerEmail, customer.user_id || 0]);

        // Merge invoices, removing duplicates
        const allInvoices = [...invoices];
        invoicesByEmail.forEach(inv => {
          if (!allInvoices.find(i => i.id === inv.id)) {
            allInvoices.push(inv);
          }
        });

        // Get user profile data (address, city, state, pincode from users table)
        let profile = null;
        if (customer.user_id) {
          try {
            const [userProfile] = await db.query(
              'SELECT address, city, state, pincode FROM users WHERE id = ?',
              [customer.user_id]
            );
            if (userProfile && userProfile.length > 0) {
              profile = {
                address: userProfile[0].address || null,
                city: userProfile[0].city || null,
                state: userProfile[0].state || null,
                pincode: userProfile[0].pincode || null
              };
            }
          } catch (profileError) {
            console.warn(`Could not fetch profile for user ${customer.user_id}:`, profileError.message);
            profile = null;
          }
        }

        // Get user addresses from user_addresses table
        let addresses = [];
        if (customer.user_id) {
          try {
            addresses = await db.query(
              `SELECT 
                id, address_type, full_name, phone, address_line1, address_line2, 
                city, state, pincode, landmark, is_default, created_at, updated_at
              FROM user_addresses 
              WHERE user_id = ? 
              ORDER BY is_default DESC, created_at DESC`,
              [customer.user_id]
            );
          } catch (addressError) {
            // Table might not exist yet, return empty array
            console.warn(`Could not fetch addresses for user ${customer.user_id}:`, addressError.message);
            addresses = [];
          }
        }

        // Calculate totals - ensure orders and invoices are arrays
        const ordersArray = Array.isArray(orders) ? orders : [];
        const invoicesArray = Array.isArray(allInvoices) ? allInvoices : [];
        
        const totalOrders = ordersArray.length;
        const totalInvoices = invoicesArray.length;
        const totalSpent = ordersArray.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        const totalPaid = invoicesArray
          .filter(inv => inv.payment_status === 'paid')
          .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

        return {
          id: customer.user_id || `guest_${customerEmail}`,
          user_id: customer.user_id,
          email: customerEmail,
          name: customer.name || customer.order_name,
          phone: customer.phone || customer.order_phone,
          is_active: customer.is_active,
          has_account: !!customer.user_id,
          created_at: customer.user_created_at || ordersArray[0]?.created_at,
          profile: profile,
          addresses: addresses,
          stats: {
            total_orders: totalOrders,
            total_invoices: totalInvoices,
            total_spent: totalSpent || 0,
            total_paid: totalPaid || 0
          },
          orders: ordersArray,
          invoices: invoicesArray
        };
      })
    );

    console.log(`✅ Found ${customersWithDetails.length} customers out of ${totalCustomers} total`);

    res.json({
      customers: customersWithDetails,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCustomers / limitValue),
        totalCustomers: totalCustomers,
        hasNext: pageNum < Math.ceil(totalCustomers / limitValue),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('=== GET ALL CUSTOMERS ERROR ===');
    console.error('Error fetching customers:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
});

// Get single customer details with all orders and invoices
router.get('/:customerId', devBypassAdmin, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Check if customerId is a user_id or guest email
    let customer = null;
    let customerEmail = null;
    
    if (customerId.startsWith('guest_')) {
      customerEmail = customerId.replace('guest_', '');
    } else {
      // Try to find user with profile
      const [user] = await db.query(
        'SELECT id, name, email, phone, address, city, state, pincode, is_active, created_at FROM users WHERE id = ?',
        [customerId]
      );
      
      if (user) {
        customer = user;
        customerEmail = user.email;
      }
    }

    if (!customerEmail) {
      // Try to find by email directly
      const [userByEmail] = await db.query(
        'SELECT id, name, email, phone, address, city, state, pincode, is_active, created_at FROM users WHERE email = ?',
        [customerId]
      );
      
      if (userByEmail) {
        customer = userByEmail;
        customerEmail = userByEmail.email;
      } else {
        customerEmail = customerId;
      }
    }

    // Get all orders for this customer with full details
    const orders = await db.query(`
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [customerEmail]);

    // Get all invoices
    let invoices = [];
    if (customer?.id) {
      invoices = await db.query(`
        SELECT 
          i.*,
          o.order_number
        FROM invoices i
        LEFT JOIN orders o ON i.order_id = o.id
        WHERE i.customer_id = ?
        ORDER BY i.created_at DESC
      `, [customer.id]);
    }
    
    // Also get invoices by email match
    const invoicesByEmail = await db.query(`
      SELECT 
        i.*,
        o.order_number
      FROM invoices i
      INNER JOIN orders o ON i.order_id = o.id
      WHERE o.customer_email = ?
        AND (i.customer_id IS NULL OR i.customer_id != ?)
      ORDER BY i.created_at DESC
    `, [customerEmail, customer?.id || 0]);

    // Merge invoices
    const allInvoices = [...invoices];
    invoicesByEmail.forEach(inv => {
      if (!allInvoices.find(i => i.id === inv.id)) {
        allInvoices.push(inv);
      }
    });

    // Get user profile and addresses if customer has account
    let profile = null;
    let addresses = [];
    
    if (customer?.id) {
      profile = {
        address: customer.address || null,
        city: customer.city || null,
        state: customer.state || null,
        pincode: customer.pincode || null
      };
      
      // Get addresses from user_addresses table
      try {
        addresses = await db.query(
          `SELECT 
            id, address_type, full_name, phone, address_line1, address_line2, 
            city, state, pincode, landmark, is_default, created_at, updated_at
          FROM user_addresses 
          WHERE user_id = ? 
          ORDER BY is_default DESC, created_at DESC`,
          [customer.id]
        );
      } catch (addressError) {
        // Table might not exist yet, return empty array
        console.warn(`Could not fetch addresses for user ${customer.id}:`, addressError.message);
        addresses = [];
      }
    }

    const loginDetails = customer ? {
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      is_active: customer.is_active,
      account_created_at: customer.created_at
    } : null;

    // Ensure orders and invoices are arrays and calculate stats
    const ordersArray = Array.isArray(orders) ? orders : [];
    const invoicesArray = Array.isArray(allInvoices) ? allInvoices : [];
    
    const totalOrders = ordersArray.length;
    const totalInvoices = invoicesArray.length;
    const totalSpent = ordersArray.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const totalPaid = invoicesArray
      .filter(inv => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

    res.json({
      customer: {
        id: customer?.id || `guest_${customerEmail}`,
        user_id: customer?.id,
        email: customerEmail,
        name: customer?.name || ordersArray[0]?.customer_name,
        phone: customer?.phone || ordersArray[0]?.customer_phone,
        has_account: !!customer,
        login_details: loginDetails,
        profile: profile,
        addresses: addresses,
        stats: {
          total_orders: totalOrders,
          total_invoices: totalInvoices,
          total_spent: totalSpent || 0,
          total_paid: totalPaid || 0
        },
        orders: ordersArray,
        invoices: invoicesArray
      }
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ message: 'Error fetching customer details', error: error.message });
  }
});

module.exports = router;

