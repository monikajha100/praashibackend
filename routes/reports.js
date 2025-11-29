const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Development bypass middleware
const devBypass = (req, res, next) => {
  if (process.env.DEV_ALLOW_NONADMIN === 'true') {
    req.user = { userId: 1, email: 'dev@test.com', role: 'admin' };
  }
  next();
};

const devBypassAdmin = (req, res, next) => {
  if (process.env.DEV_ALLOW_NONADMIN === 'true') {
    return next();
  }
  return requireAdmin(req, res, next);
};

// Get Sales Reports
router.get('/sales', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { startDate, endDate, period = '30d' } = req.query;
    
    let dateCondition = '';
    let params = [];
    
    if (startDate && endDate) {
      dateCondition = 'AND o.created_at BETWEEN ? AND ?';
      params = [startDate, endDate];
    } else {
      // Default to period-based filtering
      if (period === '7d') {
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      } else if (period === '30d') {
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      } else if (period === '90d') {
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
      } else if (period === '1y') {
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
      }
    }

    // Total sales summary
    const [salesSummary] = await db.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.user_id) as total_customers,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.discount_amount), 0) as total_discounts,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(DISTINCT CASE WHEN o.payment_status = 'paid' THEN o.id END) as paid_orders,
        COUNT(DISTINCT CASE WHEN o.payment_status = 'pending' THEN o.id END) as pending_orders
      FROM orders o
      WHERE 1=1 ${dateCondition}
    `, params);

    // Daily sales trend
    const dailySales = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE 1=1 ${dateCondition}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, params);

    // Sales by payment method
    const salesByPaymentMethod = await db.query(`
      SELECT 
        payment_method,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE 1=1 ${dateCondition}
      GROUP BY payment_method
    `, params);

    // Sales by status
    const salesByStatus = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE 1=1 ${dateCondition}
      GROUP BY status
    `, params);

    // Top selling products
    const topProducts = await db.query(`
      SELECT 
        oi.product_name,
        oi.product_id,
        SUM(oi.quantity) as total_quantity,
        COALESCE(SUM(oi.total_price), 0) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE 1=1 ${dateCondition}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `, params);

    res.json({
      period: startDate && endDate ? 'custom' : period,
      summary: salesSummary,
      dailySales,
      salesByPaymentMethod,
      salesByStatus,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching sales reports:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching sales reports', 
      error: error.message 
    });
  }
});

// Get Customer Analytics
router.get('/customers', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateCondition = '';
    if (period === '7d') {
      dateCondition = 'AND u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      dateCondition = 'AND u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === '90d') {
      dateCondition = 'AND u.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // Customer summary
    const [customerSummary] = await db.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers_30d,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_customers
      FROM users
      WHERE role = 'user' OR role IS NULL
    `);

    // Customer registration trend
    const customerTrend = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_customers
      FROM users
      WHERE (role = 'user' OR role IS NULL) ${dateCondition}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Top customers by revenue
    const topCustomers = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE (u.role = 'user' OR u.role IS NULL)
      GROUP BY u.id
      HAVING total_orders > 0
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    // Customer lifetime value distribution
    const customerLTVDistribution = await db.query(`
      SELECT 
        CASE 
          WHEN total_spent < 1000 THEN '< ₹1,000'
          WHEN total_spent < 5000 THEN '₹1,000 - ₹5,000'
          WHEN total_spent < 10000 THEN '₹5,000 - ₹10,000'
          WHEN total_spent < 50000 THEN '₹10,000 - ₹50,000'
          ELSE '₹50,000+'
        END as ltv_range,
        COUNT(*) as customer_count
      FROM (
        SELECT 
          u.id,
          COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE (u.role = 'user' OR u.role IS NULL)
        GROUP BY u.id
      ) as customer_totals
      GROUP BY ltv_range
      ORDER BY 
        CASE ltv_range
          WHEN '< ₹1,000' THEN 1
          WHEN '₹1,000 - ₹5,000' THEN 2
          WHEN '₹5,000 - ₹10,000' THEN 3
          WHEN '₹10,000 - ₹50,000' THEN 4
          ELSE 5
        END
    `);

    res.json({
      period,
      summary: customerSummary,
      customerTrend,
      topCustomers,
      customerLTVDistribution
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching customer analytics', 
      error: error.message 
    });
  }
});

// Get Order Analytics
router.get('/orders', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateCondition = '';
    if (period === '7d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === '90d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // Order summary
    const [orderSummary] = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COALESCE(AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)), 0) as avg_fulfillment_time_hours
      FROM orders
      WHERE 1=1 ${dateCondition}
    `);

    // Orders by hour of day
    const ordersByHour = await db.query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as order_count
      FROM orders
      WHERE 1=1 ${dateCondition}
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `);

    // Orders by day of week
    const ordersByDayOfWeek = await db.query(`
      SELECT 
        DAYNAME(created_at) as day_name,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE 1=1 ${dateCondition}
      GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
      ORDER BY DAYOFWEEK(created_at)
    `);

    // Average items per order
    const [itemsPerOrder] = await db.query(`
      SELECT 
        COALESCE(AVG(items_count), 0) as avg_items_per_order
      FROM (
        SELECT 
          order_id,
          COUNT(*) as items_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE 1=1 ${dateCondition.replace('created_at', 'o.created_at')}
        GROUP BY order_id
      ) as order_items_count
    `);

    res.json({
      period,
      summary: { ...orderSummary, ...itemsPerOrder },
      ordersByHour,
      ordersByDayOfWeek
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching order analytics', 
      error: error.message 
    });
  }
});

// Get Growth Metrics
router.get('/growth', devBypass, devBypassAdmin, async (req, res) => {
  try {
    // Compare current month vs last month
    const [currentMonth] = await db.query(`
      SELECT 
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(DISTINCT user_id) as customers
      FROM orders
      WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
    `);

    const [lastMonth] = await db.query(`
      SELECT 
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(DISTINCT user_id) as customers
      FROM orders
      WHERE created_at >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
        AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01')
    `);

    // Calculate growth percentages
    const calculateGrowth = (current, last) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last * 100).toFixed(2);
    };

    const growthMetrics = {
      orders: {
        current: currentMonth.orders,
        last: lastMonth.orders,
        growth: calculateGrowth(currentMonth.orders, lastMonth.orders)
      },
      revenue: {
        current: currentMonth.revenue,
        last: lastMonth.revenue,
        growth: calculateGrowth(currentMonth.revenue, lastMonth.revenue)
      },
      customers: {
        current: currentMonth.customers,
        last: lastMonth.customers,
        growth: calculateGrowth(currentMonth.customers, lastMonth.customers)
      }
    };

    // Monthly revenue trend (last 12 months)
    const monthlyRevenueTrend = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);

    // Product category performance
    const categoryPerformance = await db.query(`
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT p.id) as products_count,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT 10
    `);

    res.json({
      growthMetrics,
      monthlyRevenueTrend,
      categoryPerformance
    });
  } catch (error) {
    console.error('Error fetching growth metrics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching growth metrics', 
      error: error.message 
    });
  }
});

// Export data (CSV format)
router.get('/export/:reportType', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, format = 'csv' } = req.query;

    let data = [];
    let filename = '';
    let headers = [];

    switch (reportType) {
      case 'sales':
        const dateCondition = startDate && endDate 
          ? 'WHERE created_at BETWEEN ? AND ?' 
          : 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        const params = startDate && endDate ? [startDate, endDate] : [];

        data = await db.query(`
          SELECT 
            order_number,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as order_date,
            customer_name,
            customer_email,
            status,
            payment_status,
            payment_method,
            total_amount,
            discount_amount,
            final_amount
          FROM orders
          ${dateCondition}
          ORDER BY created_at DESC
        `, params);

        headers = ['Order Number', 'Date', 'Customer', 'Email', 'Status', 'Payment Status', 'Payment Method', 'Total', 'Discount', 'Final Amount'];
        filename = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'customers':
        data = await db.query(`
          SELECT 
            u.name,
            u.email,
            u.phone,
            DATE_FORMAT(u.created_at, '%Y-%m-%d') as registration_date,
            COUNT(o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent,
            u.is_active
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          WHERE (u.role = 'user' OR u.role IS NULL)
          GROUP BY u.id
          ORDER BY total_spent DESC
        `);

        headers = ['Name', 'Email', 'Phone', 'Registration Date', 'Total Orders', 'Total Spent', 'Active'];
        filename = `customers-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'products':
        data = await db.query(`
          SELECT 
            p.name,
            p.sku,
            c.name as category,
            p.price,
            p.stock_quantity,
            COALESCE(SUM(oi.quantity), 0) as total_sold,
            COALESCE(SUM(oi.total_price), 0) as revenue,
            p.is_active
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN order_items oi ON p.id = oi.product_id
          GROUP BY p.id
          ORDER BY revenue DESC
        `);

        headers = ['Product Name', 'SKU', 'Category', 'Price', 'Stock', 'Total Sold', 'Revenue', 'Active'];
        filename = `products-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Convert to CSV
    if (format === 'csv') {
      let csv = headers.join(',') + '\n';
      data.forEach(row => {
        csv += Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      // Return JSON
      res.json({ data, headers });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error exporting report', 
      error: error.message 
    });
  }
});

module.exports = router;
