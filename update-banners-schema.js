const { sequelize } = require('./config/sequelize');
const { Banner } = require('./models');

async function updateBannersSchema() {
  try {
    console.log('Starting banners schema update...');
    
    // Add new columns to the banners table
    await sequelize.query(`
      ALTER TABLE banners 
      ADD COLUMN IF NOT EXISTS mobile_title VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS mobile_subtitle VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS mobile_image VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS device_type ENUM('desktop', 'mobile', 'both') DEFAULT 'both'
    `);
    
    console.log('✅ Successfully added new columns to banners table');
    
    // Update existing records to have default values
    await Banner.update(
      {
        device_type: 'both',
        mobile_title: sequelize.col('title'),
        mobile_subtitle: sequelize.col('subtitle'),
        mobile_image: sequelize.col('image')
      },
      {
        where: {}
      }
    );
    
    console.log('✅ Successfully updated existing records with default values');
    
    console.log('🎉 Banners schema update completed successfully!');
    console.log('You can now manage desktop and mobile banners from the admin panel at /admin/banners');
    
  } catch (error) {
    console.error('❌ Error updating banners schema:', error);
  } finally {
    await sequelize.close();
  }
}

updateBannersSchema();
