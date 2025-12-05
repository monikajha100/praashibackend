/**
 * This script resets the Razorpay instance cache
 * Run this if you've updated keys but haven't restarted the server
 * 
 * Note: This only works if you restart the server after running this.
 * The actual cache is in the running server process.
 */

const db = require('./config/database');

async function resetCache() {
  console.log('⚠️  Razorpay instance cache reset');
  console.log('');
  console.log('The Razorpay instance is cached in your running backend server.');
  console.log('To clear the cache, you MUST restart your backend server.');
  console.log('');
  console.log('Steps:');
  console.log('1. Stop your backend server (Ctrl+C or kill the process)');
  console.log('2. Start it again (node server.js or npm start)');
  console.log('3. The new keys will be loaded');
  console.log('');
  console.log('Current keys in database:');
  
  try {
    const settings = await db.query(`
      SELECT setting_key, setting_value
      FROM company_settings
      WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret')
    `);
    
    settings.forEach(setting => {
      if (setting.setting_key === 'razorpay_key_id') {
        console.log(`  Key ID: ${setting.setting_value}`);
      } else {
        console.log(`  Key Secret: ${'*'.repeat(20)}${setting.setting_value.slice(-4)}`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  setTimeout(() => process.exit(0), 100);
}

resetCache();















