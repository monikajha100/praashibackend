const { sequelize } = require('./config/sequelize');
const { PromotionalBanner } = require('./models');

async function updatePromotionalBannersSchema() {
  try {
    console.log('Starting promotional banners schema update...');
    
    // Add new columns to the promotional_banners table
    await sequelize.query(`
      ALTER TABLE promotional_banners 
      ADD COLUMN IF NOT EXISTS device_type ENUM('desktop', 'mobile', 'both') DEFAULT 'both',
      ADD COLUMN IF NOT EXISTS mobile_text VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS mobile_background_color VARCHAR(7) DEFAULT '#000000',
      ADD COLUMN IF NOT EXISTS mobile_text_color VARCHAR(7) DEFAULT '#FFFFFF',
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS mobile_image_url VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS link_url VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) NULL
    `);
    
    console.log('✅ Successfully added new columns to promotional_banners table');
    
    // Update existing records to have default values
    await PromotionalBanner.update(
      {
        device_type: 'both',
        mobile_text: sequelize.col('text'),
        mobile_background_color: sequelize.col('background_color'),
        mobile_text_color: sequelize.col('text_color')
      },
      {
        where: {}
      }
    );
    
    console.log('✅ Successfully updated existing records with default values');
    
    console.log('🎉 Promotional banners schema update completed successfully!');
    console.log('You can now manage mobile banners from the admin panel at /admin/promotional-banners');
    
  } catch (error) {
    console.error('❌ Error updating promotional banners schema:', error);
  } finally {
    await sequelize.close();
  }
}

updatePromotionalBannersSchema();
