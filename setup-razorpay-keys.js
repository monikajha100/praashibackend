const db = require('./config/database');

/**
 * Helper script to set Razorpay test keys in the database
 * 
 * Usage:
 *   node setup-razorpay-keys.js <key_id> <key_secret>
 * 
 * Example:
 *   node setup-razorpay-keys.js rzp_test_xxxxxxxxxxxxx your_secret_key
 */

async function setupRazorpayKeys() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage: node setup-razorpay-keys.js <key_id> <key_secret>');
      console.log('');
      console.log('Example:');
      console.log('  node setup-razorpay-keys.js rzp_test_xxxxxxxxxxxxx your_secret_key');
      console.log('');
      console.log('To get your Razorpay test keys:');
      console.log('  1. Go to https://dashboard.razorpay.com');
      console.log('  2. Sign in to your account');
      console.log('  3. Go to Settings → API Keys');
      console.log('  4. Copy your Test Key ID and Test Key Secret');
      process.exit(1);
    }
    
    let keyId = args[0].trim();
    let keySecret = args[1].trim();
    
    // Remove quotes if accidentally included
    if ((keyId.startsWith('"') && keyId.endsWith('"')) || (keyId.startsWith("'") && keyId.endsWith("'"))) {
      keyId = keyId.slice(1, -1);
    }
    if ((keySecret.startsWith('"') && keySecret.endsWith('"')) || (keySecret.startsWith("'") && keySecret.endsWith("'"))) {
      keySecret = keySecret.slice(1, -1);
    }
    
    // Validate key format
    if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
      console.error('❌ Error: Key ID must start with "rzp_test_" or "rzp_live_"');
      console.error(`   Got: ${keyId.substring(0, 30)}...`);
      process.exit(1);
    }
    
    if (keySecret.length < 20) {
      console.error('❌ Error: Key Secret appears to be invalid (too short)');
      console.error(`   Length: ${keySecret.length} characters (should be 30+)`);
      console.error(`   Value: ${keySecret.substring(0, 20)}...`);
      console.error('\n💡 Make sure you copied the FULL Key Secret from Razorpay dashboard.');
      console.error('   It should be a long string of letters and numbers (no spaces).');
      process.exit(1);
    }
    
    if (keySecret.includes(' ')) {
      console.error('❌ Error: Key Secret contains spaces!');
      console.error('   The secret should not have any spaces in it.');
      console.error('\n💡 If your secret has spaces, make sure you copied it correctly.');
      process.exit(1);
    }
    
    // Warn about common placeholder values
    if (keySecret.toLowerCase().includes('secret') || keySecret.toLowerCase() === 'thisisasecret') {
      console.error('❌ Error: This looks like a placeholder secret, not a real one!');
      console.error('   Please get your actual Key Secret from Razorpay dashboard.');
      console.error('   Go to: Settings → API Keys → Test Keys → Click "Reveal"');
      process.exit(1);
    }
    
    console.log('Setting up Razorpay keys...');
    console.log('Key ID:', keyId);
    console.log('Key Secret:', '***' + keySecret.slice(-4));
    
    // Check if keys already exist
    const existing = await db.query(`
      SELECT setting_key, setting_value 
      FROM company_settings 
      WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret')
    `);
    
    if (existing.length > 0) {
      console.log('\n⚠️  Warning: Razorpay keys already exist in database:');
      existing.forEach(setting => {
        if (setting.setting_key === 'razorpay_key_id') {
          console.log(`   Current Key ID: ${setting.setting_value}`);
        } else {
          console.log(`   Current Key Secret: ***${setting.setting_value.slice(-4)}`);
        }
      });
      console.log('\nUpdating with new keys...');
    }
    
    // Insert or update keys
    await db.query(`
      INSERT INTO company_settings (setting_key, setting_value)
      VALUES ('razorpay_key_id', ?)
      ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      updated_at = CURRENT_TIMESTAMP
    `, [keyId]);
    
    await db.query(`
      INSERT INTO company_settings (setting_key, setting_value)
      VALUES ('razorpay_key_secret', ?)
      ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      updated_at = CURRENT_TIMESTAMP
    `, [keySecret]);
    
    // Also enable Razorpay if not already enabled
    await db.query(`
      INSERT INTO company_settings (setting_key, setting_value)
      VALUES ('razorpay_enabled', 'true')
      ON DUPLICATE KEY UPDATE
      setting_value = 'true',
      updated_at = CURRENT_TIMESTAMP
    `);
    
    console.log('\n✅ Razorpay keys configured successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: node test-razorpay-config.js (to verify configuration)');
    console.log('  2. Restart your backend server');
    console.log('  3. Try the payment flow again');
    
  } catch (error) {
    console.error('\n❌ Error setting up Razorpay keys:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    setTimeout(() => process.exit(0), 100);
  }
}

setupRazorpayKeys();

