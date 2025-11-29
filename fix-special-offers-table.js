/**
 * Fix Special Offers Table - Add Missing Columns
 * This script adds all missing columns to the special_offers table
 * Run this if you get "Unknown column" errors
 */

const { sequelize } = require('./config/sequelize');
const fs = require('fs');
const path = require('path');

async function fixTable() {
  console.log('\n========================================');
  console.log('  Fix Special Offers Table');
  console.log('========================================\n');

  try {
    // Test connection first
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'fix-special-offers-columns.sql');
    console.log('📄 Reading SQL file:', sqlFilePath);
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL file not found:', sqlFilePath);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split by semicolons and filter out comments and empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Check if table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'special_offers'");
    if (tables.length === 0) {
      console.log('⚠️  Table special_offers does not exist. Creating it first...\n');
      
      // Read the create table SQL
      const createTablePath = path.join(__dirname, 'migrations', 'create-special-offers-table.sql');
      if (fs.existsSync(createTablePath)) {
        const createSQL = fs.readFileSync(createTablePath, 'utf8');
        const createStatements = createSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt.toUpperCase().includes('CREATE TABLE'));
        
        if (createStatements.length > 0) {
          console.log('Creating table...');
          await sequelize.query(createStatements[0]);
          console.log('✅ Table created!\n');
        }
      } else {
        console.error('❌ Cannot find create-special-offers-table.sql');
        process.exit(1);
      }
    }

    // Get existing columns first
    console.log('📋 Checking existing columns...');
    const [existingColumns] = await sequelize.query("SHOW COLUMNS FROM special_offers");
    const existingColumnNames = existingColumns.map(col => col.Field.toLowerCase());
    console.log(`   Found ${existingColumnNames.length} existing columns\n`);

    // Get existing indexes
    const [existingIndexes] = await sequelize.query("SHOW INDEXES FROM special_offers");
    const existingIndexNames = existingIndexes.map(idx => idx.Key_name.toLowerCase());
    console.log(`   Found ${existingIndexNames.length} existing indexes\n`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Extract column name from ALTER TABLE statements
      let shouldSkip = false;
      let columnName = null;
      
      if (statement.toUpperCase().includes('ALTER TABLE') && statement.toUpperCase().includes('ADD COLUMN')) {
        // Extract column name from: ADD COLUMN `column_name`
        const match = statement.match(/ADD COLUMN\s+`?(\w+)`?/i);
        if (match) {
          columnName = match[1].toLowerCase();
          if (existingColumnNames.includes(columnName)) {
            shouldSkip = true;
            console.log(`⚙️  [${i + 1}/${statements.length}] Column '${columnName}' already exists, skipping...`);
            console.log(`   ⚠️  Skipped\n`);
            skipCount++;
            continue;
          }
        }
        console.log(`⚙️  [${i + 1}/${statements.length}] Adding column '${columnName || 'unknown'}'...`);
      } else if (statement.toUpperCase().includes('CREATE INDEX')) {
        // Extract index name from: CREATE INDEX `index_name`
        const match = statement.match(/CREATE INDEX\s+`?(\w+)`?/i);
        if (match) {
          const indexName = match[1].toLowerCase();
          if (existingIndexNames.includes(indexName)) {
            shouldSkip = true;
            console.log(`⚙️  [${i + 1}/${statements.length}] Index '${indexName}' already exists, skipping...`);
            console.log(`   ⚠️  Skipped\n`);
            skipCount++;
            continue;
          }
        }
        console.log(`⚙️  [${i + 1}/${statements.length}] Creating index...`);
      } else if (statement.toUpperCase().includes('UPDATE')) {
        console.log(`⚙️  [${i + 1}/${statements.length}] Updating existing data...`);
      } else {
        console.log(`⚙️  [${i + 1}/${statements.length}] Executing statement...`);
      }

      if (shouldSkip) {
        continue;
      }

      try {
        await sequelize.query(statement);
        console.log(`   ✅ Success!\n`);
        successCount++;
        
        // Update our tracking lists if column/index was added
        if (columnName) {
          existingColumnNames.push(columnName);
        }
      } catch (error) {
        if (error.message.includes('Duplicate column name') || 
            error.message.includes('already exists') ||
            error.message.includes('Duplicate key name') ||
            error.message.includes('Duplicate entry')) {
          console.log(`   ⚠️  Already exists, skipping...\n`);
          skipCount++;
        } else {
          console.error(`   ❌ Error:`, error.message);
          // Don't exit on error, continue with other statements
          errorCount++;
        }
      }
    }

    console.log('========================================');
    console.log('✅ Fix completed!');
    console.log(`   Success: ${successCount}`);
    console.log(`   Skipped (already exists): ${skipCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('========================================\n');

    // Verify columns
    console.log('📊 Verifying columns...');
    const [columns] = await sequelize.query("SHOW COLUMNS FROM special_offers");
    console.log(`✅ Found ${columns.length} columns in special_offers table\n`);
    
    // Check for key columns
    const columnNames = columns.map(col => col.Field);
    const requiredColumns = [
      'discount_percentage',
      'offer_type',
      'discount_amount',
      'minimum_purchase_amount',
      'buy_quantity',
      'get_quantity'
    ];
    
    console.log('📋 Checking required columns:');
    requiredColumns.forEach(col => {
      if (columnNames.includes(col)) {
        console.log(`   ✅ ${col}`);
      } else {
        console.log(`   ❌ ${col} - MISSING!`);
      }
    });
    console.log('');

    console.log('========================================');
    console.log('🎉 All done! You can now:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test the special offers endpoint');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the fix
fixTable();
