const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixTableStructure() {
  let connection;
  
  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'praashibysupal_db'
    });

    console.log('Connected to MySQL database');

    // Check if name column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'praashibysupal_db' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'name'
    `);

    if (columns.length === 0) {
      console.log('Adding missing name column to users table...');
      await connection.execute('ALTER TABLE users ADD COLUMN name VARCHAR(100) NOT NULL AFTER id');
      console.log('Added name column');
    } else {
      console.log('Name column already exists');
    }

    // Check if other missing columns exist and add them
    const [allColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'praashibysupal_db' 
      AND TABLE_NAME = 'users'
    `);

    const existingColumns = allColumns.map(col => col.COLUMN_NAME);
    console.log('Existing columns:', existingColumns);

    // Add missing columns if they don't exist
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
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding missing column: ${column.name}`);
        await connection.execute(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
      }
    }

    // Check if admin user exists
    const [adminUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@praashibysupal.com']
    );

    if (adminUser.length === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await connection.execute(
        'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
        ['Admin User', 'admin@praashibysupal.com', hashedPassword, 'admin', 1]
      );
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Create other tables if they don't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Categories table ready');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        category_id INT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        sku VARCHAR(100) UNIQUE,
        stock_quantity INT DEFAULT 0,
        weight DECIMAL(8,2),
        material VARCHAR(100),
        color VARCHAR(50),
        size VARCHAR(50),
        primary_image VARCHAR(255),
        images JSON,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log('Products table ready');

    // Insert sample categories if they don't exist
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    if (categoryCount[0].count === 0) {
      await connection.execute(`
        INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
        ('Rings', 'rings', 'Beautiful rings for every occasion', 1, 1),
        ('Necklaces', 'necklaces', 'Elegant necklaces and chains', 1, 2),
        ('Earrings', 'earrings', 'Stylish earrings collection', 1, 3),
        ('Bracelets', 'bracelets', 'Charming bracelets and bangles', 1, 4),
        ('Watches', 'watches', 'Fashionable watches', 1, 5),
        ('Fragrance', 'fragrance', 'Luxury fragrances', 1, 6),
        ('Victorian Sets', 'victorian', 'Classic Victorian jewelry sets', 1, 7),
        ('Color Changing', 'color-changing', 'Magic color changing jewelry', 1, 8),
        ('Bridal Collection', 'bridal', 'Exclusive bridal jewelry', 1, 9)
      `);
      console.log('Sample categories inserted');
    }

    console.log('\n✅ Database structure fixed successfully!');
    console.log('Admin credentials:');
    console.log('Email: admin@praashibysupal.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTableStructure();
