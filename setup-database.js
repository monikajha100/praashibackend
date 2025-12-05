const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Connected to MySQL server');

    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS praashibysupal_db');
    console.log('Database created or already exists');

    // Use the database
    await connection.execute('USE praashibysupal_db');
    console.log('Using database: praashibysupal_db');

    // Read and execute schema
    const fs = require('fs');
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    console.log('Database schema created');

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@praashibysupal.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin user exists
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingAdmin.length === 0) {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      // Create admin user
      await connection.execute(
        'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
        ['Admin User', adminEmail, hashedPassword, 'admin', 1]
      );
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Insert sample data
    const seed = fs.readFileSync('./database/seed.sql', 'utf8');
    const seedStatements = seed.split(';').filter(stmt => stmt.trim());
    
    for (const statement of seedStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Ignore duplicate key errors
          if (!error.message.includes('Duplicate entry')) {
            console.log('Seed statement error:', error.message);
          }
        }
      }
    }
    console.log('Sample data inserted');

    console.log('\n✅ Database setup completed successfully!');
    console.log('Admin credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
