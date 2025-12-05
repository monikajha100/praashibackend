const db = require('./config/database');

async function checkPaymentSettings() {
  try {
    console.log('🔍 Checking current payment settings...');
    
    const settings = await db.query(`
      SELECT setting_key, setting_value, setting_type
      FROM company_settings 
      WHERE setting_key IN ('razorpay_enabled', 'cod_enabled', 'auto_generate_invoice')
    `);
    
    console.log('📋 Current payment settings:');
    if (settings.length === 0) {
      console.log('   No payment settings found in database');
    } else {
      settings.forEach(setting => {
        console.log(`   - ${setting.setting_key}: ${setting.setting_value} (${setting.setting_type})`);
      });
    }
    
    // Enable COD if not already enabled
    console.log('🚀 Enabling COD payment method...');
    
    await db.query(`
      INSERT INTO company_settings (setting_key, setting_value, setting_type)
      VALUES ('cod_enabled', 'true', 'boolean')
      ON DUPLICATE KEY UPDATE
      setting_value = 'true',
      setting_type = 'boolean',
      updated_at = CURRENT_TIMESTAMP
    `);
    
    // Enable auto-invoice generation
    await db.query(`
      INSERT INTO company_settings (setting_key, setting_value, setting_type)
      VALUES ('auto_generate_invoice', 'true', 'boolean')
      ON DUPLICATE KEY UPDATE
      setting_value = 'true',
      setting_type = 'boolean',
      updated_at = CURRENT_TIMESTAMP
    `);
    
    console.log('✅ COD payment method enabled');
    console.log('✅ Auto-invoice generation enabled');
    
    // Verify the changes
    const updatedSettings = await db.query(`
      SELECT setting_key, setting_value, setting_type
      FROM company_settings 
      WHERE setting_key IN ('razorpay_enabled', 'cod_enabled', 'auto_generate_invoice')
    `);
    
    console.log('📋 Updated payment settings:');
    updatedSettings.forEach(setting => {
      console.log(`   - ${setting.setting_key}: ${setting.setting_value} (${setting.setting_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (db.connection) {
      db.connection.end();
    }
  }
}

checkPaymentSettings();
