const db = require('./config/database');

async function checkRazorpayKeys() {
  try {
    console.log('=== CHECKING RAZORPAY KEYS IN DATABASE ===\n');
    
    const settings = await db.query(`
      SELECT setting_key, setting_value, CHAR_LENGTH(setting_value) as length
      FROM company_settings 
      WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret', 'razorpay_enabled')
      ORDER BY setting_key
    `);
    
    if (settings.length === 0) {
      console.log('❌ No Razorpay settings found in database!\n');
      console.log('Please set your Razorpay keys using:');
      console.log('  node setup-razorpay-keys.js rzp_test_YOUR_KEY_ID YOUR_KEY_SECRET\n');
      process.exit(1);
    }
    
    console.log('Current Razorpay settings in database:\n');
    
    const keys = {};
    settings.forEach(setting => {
      keys[setting.setting_key] = setting.setting_value;
      if (setting.setting_key === 'razorpay_key_id') {
        console.log(`Key ID: ${setting.setting_value}`);
        console.log(`  Length: ${setting.length} characters`);
        console.log(`  Starts with: ${setting.setting_value.substring(0, 10)}...`);
      } else if (setting.setting_key === 'razorpay_key_secret') {
        console.log(`Key Secret: ${'*'.repeat(Math.min(setting.length, 20))}${setting.setting_value.slice(-4)}`);
        console.log(`  Length: ${setting.length} characters`);
        console.log(`  Last 4 chars: ${setting.setting_value.slice(-4)}`);
        
        // Check for common issues
        if (setting.length < 20) {
          console.log('  ⚠️  WARNING: Key Secret seems too short!');
        }
        if (setting.setting_value.includes(' ')) {
          console.log('  ⚠️  WARNING: Key Secret contains spaces!');
        }
        if (setting.setting_value !== setting.setting_value.trim()) {
          console.log('  ⚠️  WARNING: Key Secret has leading/trailing whitespace!');
        }
      } else if (setting.setting_key === 'razorpay_enabled') {
        console.log(`Razorpay Enabled: ${setting.setting_value}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\nDiagnosis:');
    
    if (!keys.razorpay_key_id) {
      console.log('❌ Key ID is missing');
    } else if (!keys.razorpay_key_id.startsWith('rzp_test_') && !keys.razorpay_key_id.startsWith('rzp_live_')) {
      console.log('❌ Key ID format is invalid');
    } else {
      console.log('✅ Key ID format is correct');
    }
    
    if (!keys.razorpay_key_secret) {
      console.log('❌ Key Secret is missing');
    } else if (keys.razorpay_key_secret.length < 20) {
      console.log('❌ Key Secret appears to be too short (should be ~30+ characters)');
    } else {
      console.log('✅ Key Secret length looks okay');
    }
    
    // Check if keys match (test with test, live with live)
    if (keys.razorpay_key_id && keys.razorpay_key_secret) {
      const isTestKey = keys.razorpay_key_id.startsWith('rzp_test_');
      console.log(`\nMode: ${isTestKey ? 'TEST' : 'LIVE'}`);
      
      if (isTestKey) {
        console.log('✅ Using test keys (correct for testing)');
      } else {
        console.log('⚠️  Using LIVE keys - make sure this is intentional!');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\nCommon issues and fixes:');
    console.log('1. Key Secret might be incorrect - verify in Razorpay dashboard');
    console.log('2. Key Secret might have extra spaces - check for whitespace');
    console.log('3. Keys might be from different accounts - ensure they match');
    console.log('4. If you just updated keys, restart your backend server');
    
    console.log('\nTo update keys, run:');
    console.log('  node setup-razorpay-keys.js rzp_test_YOUR_KEY_ID YOUR_KEY_SECRET');
    
  } catch (error) {
    console.error('\n❌ Error checking keys:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    setTimeout(() => process.exit(0), 100);
  }
}

checkRazorpayKeys();















