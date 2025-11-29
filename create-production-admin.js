const bcrypt = require('bcryptjs');
const db = require('./config/database');
require('dotenv').config();

async function createProductionAdmin() {
  try {
    console.log('🔍 Checking for existing admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await db.query(
      'SELECT id, email, role FROM users WHERE email = ? OR role = "admin"',
      ['admin@praashibysupal.com']
    );

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists:');
      existingAdmin.forEach(admin => {
        console.log(`   - ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role}`);
      });
      return;
    }

    console.log('📝 Creating new admin user...');
    
    // Generate secure password hash
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123!Secure';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    const result = await db.query(
      `INSERT INTO users (name, email, password, phone, role, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        'System Administrator',
        'admin@praashibysupal.com',
        hashedPassword,
        '+91-0000000000',
        'admin',
        1
      ]
    );

    console.log('✅ Admin user created successfully!');
    console.log(`   - ID: ${result.insertId}`);
    console.log(`   - Email: admin@praashibysupal.com`);
    console.log(`   - Role: admin`);
    console.log(`   - Password: ${adminPassword}`);
    console.log('');
    console.log('🔐 IMPORTANT: Please change the password after first login!');
    console.log('📧 Admin login: admin@praashibysupal.com');
    console.log('🔑 Temporary password: ' + adminPassword);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (db.connection) {
      db.connection.end();
    }
  }
}

// Run the script
console.log('🚀 Production Admin User Setup');
console.log('================================');
createProductionAdmin();





















