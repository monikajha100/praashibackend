const db = require('./config/database');

async function enableCOD() {
  try {
    console.log('🔍 Checking current payment settings...');
    
    // Check current settings
    const currentSettings = await db.query(`
      SELECT setting_key, setting_value, setting_type
      FROM company_settings 
      WHERE setting_key IN ('razorpay_enabled', 'cod_enabled', 'auto_generate_invoice')
    `);
    
    console.log('📋 Current payment settings:');
    currentSettings.forEach(setting => {
      console.log(`   - ${setting.setting_key}: ${setting.setting_value} (${setting.setting_type})`);
    });
    
    // Enable COD and auto-invoice generation
    console.log('🚀 Enabling COD and auto-invoice generation...');
    
    const settings = [
      { key: 'cod_enabled', value: 'true', type: 'boolean' },
      { key: 'razorpay_enabled', value: 'true', type: 'boolean' },
      { key: 'auto_generate_invoice', value: 'true', type: 'boolean' }
    ];
    
    for (const setting of settings) {
      await db.query(`
        INSERT INTO company_settings (setting_key, setting_value, setting_type)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        setting_type = VALUES(setting_type),
        updated_at = CURRENT_TIMESTAMP
      `, [setting.key, setting.value, setting.type]);
      
      console.log(`✅ Updated ${setting.key} = ${setting.value}`);
    }
    
    // Verify the changes
    console.log('🔍 Verifying updated settings...');
    const updatedSettings = await db.query(`
      SELECT setting_key, setting_value, setting_type
      FROM company_settings 
      WHERE setting_key IN ('razorpay_enabled', 'cod_enabled', 'auto_generate_invoice')
    `);
    
    console.log('📋 Updated payment settings:');
    updatedSettings.forEach(setting => {
      console.log(`   - ${setting.setting_key}: ${setting.setting_value} (${setting.setting_type})`);
    });
    
    console.log('🎉 COD payment method enabled successfully!');
    console.log('📝 Both Razorpay and COD are now available in checkout');
    console.log('🧾 Auto-invoice generation is enabled for all orders');
    
  } catch (error) {
    console.error('❌ Error enabling COD:', error);
  } finally {
    if (db.connection) {
      db.connection.end();
    }
  }
}

// Run the script
enableCOD();
