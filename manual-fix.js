// Manual Database Fix Script
// Run this with: node manual-fix.js

const mysql = require('mysql2/promise');

async function manualFix() {
  let connection;
  
  try {
    console.log('🔧 Starting database fix...');
    
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'praashibysupal_db'
    });

    console.log('✅ Connected to database');

    // Check current users table structure
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('📋 Current users table columns:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

    // Check if name column exists
    const hasNameColumn = columns.some(col => col.Field === 'name');
    
    if (!hasNameColumn) {
      console.log('❌ Name column missing, adding it...');
      await connection.execute('ALTER TABLE users ADD COLUMN name VARCHAR(100) NOT NULL AFTER id');
      console.log('✅ Added name column');
    } else {
      console.log('✅ Name column already exists');
    }

    // Add other missing columns
    const requiredColumns = [
      { name: 'phone', type: 'VARCHAR(15)' },
      { name: 'address', type: 'TEXT' },
      { name: 'city', type: 'VARCHAR(50)' },
      { name: 'state', type: 'VARCHAR(50)' },
      { name: 'pincode', type: 'VARCHAR(10)' },
      { name: 'role', type: "ENUM('user', 'admin') DEFAULT 'user'" },
      { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];

    for (const column of requiredColumns) {
      const exists = columns.some(col => col.Field === column.name);
      if (!exists) {
        console.log(`❌ ${column.name} column missing, adding it...`);
        await connection.execute(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ Added ${column.name} column`);
      } else {
        console.log(`✅ ${column.name} column already exists`);
      }
    }

    // Check if admin user exists
    const [adminUsers] = await connection.execute(
      'SELECT id, name, email FROM users WHERE email = ?',
      ['admin@praashibysupal.com']
    );

    if (adminUsers.length === 0) {
      console.log('❌ Admin user missing, creating it...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await connection.execute(
        'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
        ['Admin User', 'admin@praashibysupal.com', hashedPassword, 'admin', 1]
      );
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists:', adminUsers[0]);
    }

    // Test the login query
    console.log('🧪 Testing login query...');
    const [testUser] = await connection.execute(
      'SELECT id, name, email, password, phone, role, is_active FROM users WHERE email = ?',
      ['admin@praashibysupal.com']
    );
    
    if (testUser.length > 0) {
      console.log('✅ Login query works! User found:', {
        id: testUser[0].id,
        name: testUser[0].name,
        email: testUser[0].email,
        role: testUser[0].role
      });
    } else {
      console.log('❌ Login query failed - no user found');
    }

    console.log('\n🎉 Database fix completed successfully!');
    console.log('📝 Admin credentials:');
    console.log('   Email: admin@praashibysupal.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

manualFix();
