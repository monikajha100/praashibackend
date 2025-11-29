const mysql = require('mysql2');

// Direct database connection without using the pool
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'praashibysupal_db'
});

async function testUpdate() {
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
    
    console.log('🔍 Checking a specific order (ID: 68)...');
    
    // Get a specific order to test with
    const [order] = await query(
      'SELECT id, payment_method, payment_status, razorpay_payment_id FROM orders WHERE id = ?',
      [68]
    );
    
    console.log('Current order data:', order);
    
    console.log('🔍 Updating order 68 payment_method to "razorpay"...');
    
    // Update the order
    const result = await query(
      'UPDATE orders SET payment_method = ? WHERE id = ?',
      ['razorpay', 68]
    );
    
    console.log('Update result:', result);
    
    console.log('🔍 Checking order 68 after update...');
    
    // Get the order again to verify the update
    const [updatedOrder] = await query(
      'SELECT id, payment_method, payment_status, razorpay_payment_id FROM orders WHERE id = ?',
      [68]
    );
    
    console.log('Updated order data:', updatedOrder);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    connection.end();
  }
}

testUpdate();