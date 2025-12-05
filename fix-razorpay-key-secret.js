const db = require('./config/database');

/**
 * Script to fix Razorpay Key Secret issues
 * 
 * This will help you update the Key Secret properly
 */

async function fixKeySecret() {
  try {
    console.log('=== FIXING RAZORPAY KEY SECRET ===\n');
    
    // Get current Key ID
    const currentKeys = await db.query(`
      SELECT setting_key, setting_value
      FROM company_settings
      WHERE setting_key = 'razorpay_key_id'
    `);
    
    if (currentKeys.length === 0) {
      console.log('❌ No Key ID found. Please set both Key ID and Key Secret.');
      console.log('\nRun: node setup-razorpay-keys.js rzp_test_YOUR_KEY_ID YOUR_KEY_SECRET');
      process.exit(1);
    }
    
    const keyId = currentKeys[0].setting_value;
    console.log('Current Key ID:', keyId);
    console.log('\n⚠️  Your Key Secret appears to be invalid or a placeholder.');
    console.log('\nTo fix this:\n');
    console.log('1. Go to https://dashboard.razorpay.com');
    console.log('2. Sign in to your account');
    console.log('3. Go to Settings → API Keys');
    console.log('4. Under "Test Keys" section:');
    console.log('   - Copy the Key ID (should match: ' + keyId + ')');
    console.log('   - Click "Reveal" next to Key Secret');
    console.log('   - Copy the FULL Key Secret (usually 30+ characters)');
    console.log('\n5. Then run:');
    console.log(`   node setup-razorpay-keys.js ${keyId} YOUR_ACTUAL_KEY_SECRET`);
    console.log('\n⚠️  IMPORTANT: The Key Secret must:');
    console.log('   - Be the EXACT secret from Razorpay dashboard');
    console.log('   - Have NO spaces');
    console.log('   - Have NO quotes around it');
    console.log('   - Match the Key ID (both from same account)');
    console.log('\nExample:');
    console.log('   node setup-razorpay-keys.js rzp_test_1DP5mmOlF5G5ag abc123def456ghi789jkl012mno345pqr678');
    
    // Check current secret
    const currentSecret = await db.query(`
      SELECT setting_value
      FROM company_settings
      WHERE setting_key = 'razorpay_key_secret'
    `);
    
    if (currentSecret.length > 0) {
      const secret = currentSecret[0].setting_value;
      console.log('\n' + '='.repeat(60));
      console.log('Current Key Secret in database:');
      console.log(`Length: ${secret.length} characters`);
      console.log(`Value: ${secret.substring(0, 20)}...${secret.slice(-4)}`);
      
      if (secret.includes('secret') || secret.length < 20) {
        console.log('\n❌ This looks like a placeholder or invalid secret!');
        console.log('Please get your actual Key Secret from Razorpay dashboard.');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    setTimeout(() => process.exit(0), 100);
  }
}

fixKeySecret();















