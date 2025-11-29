const db = require('./config/database');
const Razorpay = require('razorpay');

// Ensure we wait for console output
process.stdout.setEncoding('utf8');

async function testRazorpayConfig() {
  try {
    console.log('=== TESTING RAZORPAY CONFIGURATION ===\n');
    
    // 1. Check database settings
    console.log('1. Checking Razorpay settings in database...');
    const settings = await db.query(`
      SELECT setting_key, setting_value 
      FROM company_settings 
      WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret', 'razorpay_enabled')
    `);
    
    console.log('Raw settings from DB:', settings);
    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });
    
    console.log('Settings object:', {
      razorpay_enabled: settingsObj.razorpay_enabled,
      razorpay_key_id: settingsObj.razorpay_key_id || 'NOT SET',
      razorpay_key_secret: settingsObj.razorpay_key_secret ? '***SET***' : 'NOT SET'
    });
    
    // 2. Validate key format
    console.log('\n2. Validating Razorpay key format...');
    const keyId = settingsObj.razorpay_key_id;
    const keySecret = settingsObj.razorpay_key_secret;
    
    if (!keyId || !keySecret) {
      console.error('❌ ERROR: Razorpay credentials not found in database!');
      console.log('\nTo fix this, run:');
      console.log('INSERT INTO company_settings (setting_key, setting_value) VALUES');
      console.log("  ('razorpay_key_id', 'rzp_test_YOUR_KEY_ID'),");
      console.log("  ('razorpay_key_secret', 'YOUR_KEY_SECRET');");
      console.log('ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);');
      process.exit(1);
    }
    
    if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
      console.error('❌ ERROR: Invalid Key ID format. Should start with "rzp_test_" or "rzp_live_"');
      process.exit(1);
    }
    
    if (keyId.startsWith('rzp_test_')) {
      console.log('✅ Key ID format is valid (test mode)');
    } else {
      console.log('✅ Key ID format is valid (live mode)');
    }
    
    if (keySecret.length < 10) {
      console.error('❌ ERROR: Key Secret appears to be invalid (too short)');
      process.exit(1);
    }
    
    console.log('✅ Key Secret format appears valid');
    
    // 3. Test Razorpay instance creation
    console.log('\n3. Testing Razorpay instance creation...');
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      console.log('✅ Razorpay instance created successfully');
      console.log('   Key ID:', razorpay.key_id);
    } catch (error) {
      console.error('❌ ERROR creating Razorpay instance:', error.message);
      process.exit(1);
    }
    
    // 4. Test creating a small order
    console.log('\n4. Testing Razorpay order creation...');
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      
      const testAmount = 100; // 100 paise = 1 rupee
      const options = {
        amount: testAmount,
        currency: 'INR',
        receipt: `test_receipt_${Date.now()}`,
        payment_capture: 1
      };
      
      console.log('Creating test order with options:', options);
      const order = await razorpay.orders.create(options);
      console.log('✅ Test order created successfully!');
      console.log('   Order ID:', order.id);
      console.log('   Amount:', order.amount, 'paise');
      console.log('   Status:', order.status);
      
      // Cancel the test order (optional)
      console.log('\n5. Cleaning up test order...');
      try {
        await razorpay.orders.cancel(order.id);
        console.log('✅ Test order cancelled');
      } catch (cancelError) {
        console.log('⚠️  Could not cancel test order (this is usually fine)');
      }
      
    } catch (razorpayError) {
      console.error('❌ ERROR creating Razorpay order:');
      console.error('   Message:', razorpayError.message);
      if (razorpayError.error) {
        console.error('   Error details:', JSON.stringify(razorpayError.error, null, 2));
      }
      if (razorpayError.statusCode) {
        console.error('   Status Code:', razorpayError.statusCode);
      }
      
      // Common errors
      if (razorpayError.message && razorpayError.message.includes('authentication')) {
        console.error('\n💡 This looks like an authentication error.');
        console.error('   Please check your Razorpay Key ID and Key Secret.');
        console.error('   Make sure you\'re using TEST keys for testing (rzp_test_...)');
      }
      
      process.exit(1);
    }
    
    console.log('\n✅ All Razorpay tests passed! Configuration is correct.');
    console.log('\nYour Razorpay configuration is ready to use.');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    if (error.error) {
      console.error('Error details:', JSON.stringify(error.error, null, 2));
    }
    process.exit(1);
  } finally {
    // Give time for output to flush
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

testRazorpayConfig();

