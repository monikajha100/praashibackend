const { sequelize } = require('./config/sequelize');

async function addUserAddressColumns() {
  try {
    console.log('=== ADDING ADDRESS COLUMNS TO USERS TABLE ===\n');
    
    // Check if columns exist
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('address', 'city', 'state', 'pincode')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Existing address columns:', existingColumns);
    
    // Add columns that don't exist
    if (!existingColumns.includes('address')) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN address VARCHAR(255) NULL 
        AFTER phone
      `);
      console.log('✅ Added "address" column');
    } else {
      console.log('⏭️  "address" column already exists');
    }
    
    if (!existingColumns.includes('city')) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN city VARCHAR(100) NULL 
        AFTER address
      `);
      console.log('✅ Added "city" column');
    } else {
      console.log('⏭️  "city" column already exists');
    }
    
    if (!existingColumns.includes('state')) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN state VARCHAR(100) NULL 
        AFTER city
      `);
      console.log('✅ Added "state" column');
    } else {
      console.log('⏭️  "state" column already exists');
    }
    
    if (!existingColumns.includes('pincode')) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN pincode VARCHAR(10) NULL 
        AFTER state
      `);
      console.log('✅ Added "pincode" column');
    } else {
      console.log('⏭️  "pincode" column already exists');
    }
    
    console.log('\n✅ All address columns are now available in users table!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

addUserAddressColumns();

