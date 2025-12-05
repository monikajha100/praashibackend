const db = require('./config/database');

async function checkPaymentMethods() {
  try {
    console.log('🔍 Checking payment methods in database...');
    
    // Get a sample of orders to check payment methods
    const orders = await db.query(`
      SELECT id, order_number, payment_method, payment_status, razorpay_payment_id 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📋 Found ${orders.length} recent orders:`);
    orders.forEach(order => {
      console.log(`   Order ${order.id} (${order.order_number}): payment_method="${order.payment_method}", payment_status="${order.payment_status}", razorpay_payment_id="${order.razorpay_payment_id}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (db.connection) {
      db.connection.end();
    }
  }
}

checkPaymentMethods();