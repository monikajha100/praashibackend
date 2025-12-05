/**
 * Debug script to test the payment flow exactly as it happens in the checkout
 */

const db = require('./config/database');
const Razorpay = require('razorpay');

async function debugPaymentFlow() {
  try {
    console.log('=== DEBUGGING PAYMENT FLOW ===\n');
    
    // Simulate what the /create-order endpoint does
    console.log('1. Getting Razorpay instance (as payment route does)...');
    const settings = await db.query(`
      SELECT setting_key, setting_value 
      FROM company_settings 
      WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret')
    `);
    
    if (!settings || settings.length === 0) {
      console.error('❌ No settings found');
      process.exit(1);
    }
    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });
    
    const razorpayConfig = {
      key_id: settingsObj.razorpay_key_id,
      key_secret: settingsObj.razorpay_key_secret
    };
    
    console.log('   Key ID:', razorpayConfig.key_id);
    console.log('   Key Secret:', '***' + razorpayConfig.key_secret.slice(-4));
    
    if (!razorpayConfig.key_id || !razorpayConfig.key_secret) {
      console.error('❌ Missing credentials');
      process.exit(1);
    }
    
    console.log('\n2. Creating Razorpay instance...');
    const razorpay = new Razorpay(razorpayConfig);
    console.log('   ✅ Instance created');
    
    // Test with a realistic amount (like ₹100)
    const testAmount = 10000; // 10000 paise = ₹100
    console.log(`\n3. Creating order with amount: ₹${testAmount / 100} (${testAmount} paise)...`);
    
    const options = {
      amount: testAmount,
      currency: 'INR',
      receipt: `debug_receipt_${Date.now()}`,
      payment_capture: 1
    };
    
    console.log('   Options:', JSON.stringify(options, null, 2));
    
    try {
      const order = await razorpay.orders.create(options);
      console.log('\n   ✅ Order created successfully!');
      console.log('   Order ID:', order.id);
      console.log('   Amount:', order.amount, 'paise (₹' + (order.amount / 100) + ')');
      console.log('   Status:', order.status);
      console.log('   Created at:', order.created_at);
      
      console.log('\n4. Testing order retrieval...');
      const retrieved = await razorpay.orders.fetch(order.id);
      console.log('   ✅ Order retrieved successfully');
      console.log('   Status:', retrieved.status);
      
      console.log('\n✅ Payment flow debug complete!');
      console.log('\nIf this works but checkout doesn\'t, the issue is likely:');
      console.log('  - Backend server not restarted (cache issue)');
      console.log('  - Frontend sending wrong data');
      console.log('  - Network/CORS issues');
      
    } catch (razorpayError) {
      console.error('\n❌ Razorpay API Error:');
      console.error('   Message:', razorpayError.message);
      console.error('   Status Code:', razorpayError.statusCode);
      if (razorpayError.error) {
        console.error('   Error Details:', JSON.stringify(razorpayError.error, null, 2));
      }
      if (razorpayError.statusCode === 401) {
        console.error('\n   This is an authentication error!');
        console.error('   - Check that Key ID and Key Secret match');
        console.error('   - Verify keys in Razorpay dashboard');
        console.error('   - Make sure both are from Test Keys section');
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    setTimeout(() => process.exit(0), 100);
  }
}

debugPaymentFlow();















