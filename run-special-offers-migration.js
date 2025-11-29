/**
 * Special Offers Database Migration Script
 * Automatically creates the special_offers table using Sequelize
 */

const { sequelize } = require('./config/sequelize');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('\n========================================');
  console.log('  Special Offers Database Migration');
  console.log('========================================\n');

  try {
    // Test connection first
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'create-special-offers-table.sql');
    console.log('📄 Reading SQL file:', sqlFilePath);
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split by semicolons and filter out comments and empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        console.log(`⚙️  [${i + 1}/${statements.length}] Creating special_offers table...`);
      } else if (statement.toUpperCase().includes('INSERT INTO')) {
        console.log(`⚙️  [${i + 1}/${statements.length}] Inserting sample data...`);
      } else {
        console.log(`⚙️  [${i + 1}/${statements.length}] Executing statement...`);
      }

      try {
        await sequelize.query(statement);
        console.log(`   ✅ Success!\n`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Table already exists, skipping...\n`);
        } else {
          console.error(`   ❌ Error:`, error.message);
          throw error;
        }
      }
    }

    console.log('========================================');
    console.log('✅ Migration completed successfully!');
    console.log('========================================\n');

    console.log('📊 Verifying table creation...');
    const [results] = await sequelize.query("SHOW TABLES LIKE 'special_offers'");
    
    if (results.length > 0) {
      console.log('✅ special_offers table exists!\n');
      
      // Count rows
      const [countResult] = await sequelize.query("SELECT COUNT(*) as count FROM special_offers");
      console.log(`📈 Sample data: ${countResult[0].count} offers inserted\n`);
      
      // Show sample data
      console.log('📋 Sample offers:');
      const [offers] = await sequelize.query("SELECT id, title, is_active FROM special_offers LIMIT 3");
      offers.forEach(offer => {
        console.log(`   ${offer.is_active ? '✅' : '❌'} [ID: ${offer.id}] ${offer.title}`);
      });
      console.log('');
    } else {
      console.log('❌ Table verification failed!\n');
    }

    console.log('========================================');
    console.log('🎉 All done! You can now:');
    console.log('   1. Restart your backend server');
    console.log('   2. Visit: http://localhost:3000/admin/special-offers');
    console.log('   3. Create and manage offers!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n📝 Manual Setup Instructions:');
    console.error('   1. Open phpMyAdmin or MySQL Workbench');
    console.error('   2. Select database: praashibysupal or praashibysupal_db');
    console.error('   3. Go to SQL tab');
    console.error('   4. Copy contents from: backend/migrations/create-special-offers-table.sql');
    console.error('   5. Execute the SQL\n');
    process.exit(1);
  }
}

// Run the migration
runMigration();
