const mysql = require('mysql2');

// Direct database connection without using the pool
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'praashibysupal_db'
});

async function populatePaymentMethods() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Promisify the connection
    const connect = () => {
      return new Promise((resolve, reject) => {
        connection.connect((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Connected to database');
            resolve();
          }
        });
      });
    };
    
    const query = (sql, params) => {
      return new Promise((resolve, reject) => {
        connection.execute(sql, params, (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    };
    
    // Connect to database
    await connect();
    
    console.log('🔍 Checking current orders...');
    
    // Get all orders with empty payment_method
    const orders = await query(`
      SELECT id, payment_method, payment_status, razorpay_payment_id 
      FROM orders 
      WHERE payment_method = '' OR payment_method IS NULL
    `);
    
    console.log(`📋 Found ${orders.length} orders with empty payment_method`);
    
    let updatedCount = 0;
    
    for (const order of orders) {
      let newPaymentMethod = 'cash_on_delivery'; // Default to COD
      
      // If there's a razorpay_payment_id, it's an online payment
      if (order.razorpay_payment_id && order.razorpay_payment_id !== '' && order.razorpay_payment_id !== 'null') {
        // Map to one of the available online payment methods
        newPaymentMethod = 'upi'; // Using UPI as default for online payments
      }
      
      // Update the order
      await query(
        'UPDATE orders SET payment_method = ? WHERE id = ?',
        [newPaymentMethod, order.id]
      );
      
      console.log(`   ✅ Updated order ${order.id} to payment_method: ${newPaymentMethod}`);
      updatedCount++;
    }
    
    // Also check for orders that have 'paid' payment_status but might not have payment_method set
    const paidOrders = await query(`
      SELECT id, payment_method, payment_status, razorpay_payment_id 
      FROM orders 
      WHERE payment_status = 'paid' AND (payment_method = '' OR payment_method IS NULL)
    `);
    
    console.log(`📋 Found ${paidOrders.length} paid orders with empty payment_method`);
    
    for (const order of paidOrders) {
      let newPaymentMethod = 'cash_on_delivery'; // Default to COD
      
      // If there's a razorpay_payment_id, it's an online payment
      if (order.razorpay_payment_id && order.razorpay_payment_id !== '' && order.razorpay_payment_id !== 'null') {
        // Map to one of the available online payment methods
        newPaymentMethod = 'upi'; // Using UPI as default for online payments
      }
      
      // Update the order
      await query(
        'UPDATE orders SET payment_method = ? WHERE id = ?',
        [newPaymentMethod, order.id]
      );
      
      console.log(`   ✅ Updated paid order ${order.id} to payment_method: ${newPaymentMethod}`);
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} orders`);
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const updatedOrders = await query(`
      SELECT id, order_number, payment_method, payment_status, razorpay_payment_id 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📋 Recent orders after update:`);
    updatedOrders.forEach(order => {
      console.log(`   Order ${order.id} (${order.order_number}): payment_method="${order.payment_method}", payment_status="${order.payment_status}", razorpay_payment_id="${order.razorpay_payment_id}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    connection.end();
  }
}

populatePaymentMethods();