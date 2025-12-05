const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndFixDatabase() {
  console.log('========================================');
  console.log('DATABASE DIAGNOSTIC AND FIX TOOL');
  console.log('========================================\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
  };

  let connection;

  try {
    // Step 1: Test connection without database
    console.log('[1/5] Testing MySQL connection...');
    console.log(`      Host: ${config.host}`);
    console.log(`      User: ${config.user}`);
    console.log(`      Port: ${config.port}`);
    
    connection = await mysql.createConnection(config);
    console.log('✓ MySQL connection successful\n');

    // Step 2: Check if database exists
    console.log('[2/5] Checking database...');
    const dbName = process.env.DB_NAME || 'praashibysupal_db';
    
    const [databases] = await connection.query(
      'SHOW DATABASES LIKE ?',
      [dbName]
    );

    if (databases.length === 0) {
      console.log(`✗ Database '${dbName}' does not exist`);
      console.log(`      Creating database...`);
      await connection.query(`CREATE DATABASE ${dbName}`);
      console.log(`✓ Database '${dbName}' created\n`);
    } else {
      console.log(`✓ Database '${dbName}' exists\n`);
    }

    // Step 3: Connect to database
    console.log('[3/5] Connecting to database...');
    await connection.changeUser({ database: dbName });
    console.log('✓ Connected to database\n');

    // Step 4: Check for special_offers table
    console.log('[4/5] Checking special_offers table...');
    const [tables] = await connection.query(
      'SHOW TABLES LIKE "special_offers"'
    );

    if (tables.length === 0) {
      console.log('✗ special_offers table does not exist');
      console.log('      Please run: node backend/run-special-offers-migration.js\n');
    } else {
      console.log('✓ special_offers table exists');
      
      // Check columns
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM special_offers'
      );
      console.log(`      Columns: ${columns.length} found\n`);
    }

    // Step 5: Check other critical tables
    console.log('[5/5] Checking other tables...');
    const criticalTables = ['users', 'products', 'categories', 'orders'];
    
    for (const table of criticalTables) {
      const [result] = await connection.query('SHOW TABLES LIKE ?', [table]);
      if (result.length > 0) {
        console.log(`✓ ${table} table exists`);
      } else {
        console.log(`✗ ${table} table missing`);
      }
    }

    console.log('\n========================================');
    console.log('DIAGNOSTIC COMPLETE');
    console.log('========================================\n');

    if (tables.length === 0) {
      console.log('REQUIRED ACTIONS:');
      console.log('1. Run migrations:');
      console.log('   cd backend');
      console.log('   node run-special-offers-migration.js\n');
    } else {
      console.log('✓ Database is ready!');
      console.log('  You can now start the backend server.\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔴 MySQL server is not running!');
      console.log('\nSOLUTIONS:');
      console.log('1. Start MySQL service:');
      console.log('   net start MySQL');
      console.log('\n2. Or start XAMPP MySQL from Control Panel');
      console.log('\n3. Or install MySQL:');
      console.log('   https://dev.mysql.com/downloads/installer/');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔴 Database credentials are incorrect!');
      console.log('\nUpdate backend/.env file with correct:');
      console.log('   DB_USER=root');
      console.log('   DB_PASSWORD=your_password');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndFixDatabase();
