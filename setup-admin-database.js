const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables from env.local
require('dotenv').config({ path: './env.local' });

async function setupAdminDatabase() {
    console.log('Setting up admin database...');
    
    const dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    };

    let connection;
    try {
        // Connect to MySQL server
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL server.');

        // Drop and recreate database
        console.log('Dropping and recreating database...');
        await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
        await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);
        console.log(`Database ${process.env.DB_NAME} created successfully.`);

        // Read and execute schema
        console.log('Creating tables...');
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await connection.query(schemaSql);
            console.log('Tables created successfully.');
        } else {
            console.log('Schema file not found, creating basic tables...');
            await createBasicTables(connection);
        }

        // Read and execute seed data
        console.log('Seeding database...');
        const seedPath = path.join(__dirname, 'database', 'seed.sql');
        if (fs.existsSync(seedPath)) {
            const seedSql = fs.readFileSync(seedPath, 'utf8');
            await connection.query(seedSql);
            console.log('Seed data inserted successfully.');
        } else {
            console.log('Seed file not found, creating basic data...');
            await createBasicData(connection);
        }

        // Ensure admin user exists
        console.log('Creating admin user...');
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        const [existingAdmin] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existingAdmin.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await connection.query(
                `INSERT INTO users (name, email, password, role, is_active, created_at, updated_at) 
                 VALUES (?, ?, ?, 'admin', 1, NOW(), NOW())`,
                ['Admin User', adminEmail, hashedPassword]
            );
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }

        // Test admin login
        console.log('Testing admin login...');
        const [adminUser] = await connection.query(
            'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
            [adminEmail]
        );

        if (adminUser.length > 0) {
            const isPasswordValid = await bcrypt.compare(adminPassword, adminUser[0].password);
            if (isPasswordValid) {
                console.log('✅ Admin login test successful!');
                console.log(`Admin Email: ${adminEmail}`);
                console.log(`Admin Password: ${adminPassword}`);
            } else {
                console.log('❌ Admin login test failed: Password mismatch.');
            }
        } else {
            console.log('❌ Admin login test failed: Admin user not found.');
        }

        console.log('🎉 Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Error during database setup:', error.message);
        if (error.sqlMessage) {
            console.error('SQL Error:', error.sqlMessage);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

async function createBasicTables(connection) {
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(15),
            address TEXT,
            city VARCHAR(50),
            state VARCHAR(50),
            pincode VARCHAR(10),
            role ENUM('user', 'admin') DEFAULT 'user',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS categories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            image VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS products (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(200) NOT NULL,
            slug VARCHAR(200) UNIQUE NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            original_price DECIMAL(10,2),
            discount_percentage INT DEFAULT 0,
            category_id INT,
            primary_image VARCHAR(255),
            images JSON,
            stock_quantity INT DEFAULT 0,
            is_featured BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS orders (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
            shipping_address JSON,
            payment_method VARCHAR(50),
            payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS order_items (
            id INT PRIMARY KEY AUTO_INCREMENT,
            order_id INT,
            product_id INT,
            quantity INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )`
    ];

    for (const table of tables) {
        await connection.query(table);
    }
}

async function createBasicData(connection) {
    // Insert categories
    const categories = [
        ['Rings', 'rings', 'Beautiful rings for every occasion'],
        ['Necklaces', 'necklaces', 'Elegant necklaces and chains'],
        ['Earrings', 'earrings', 'Stylish earrings and studs'],
        ['Bracelets', 'bracelets', 'Charming bracelets and bangles']
    ];

    for (const [name, slug, description] of categories) {
        await connection.query(
            'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
            [name, slug, description]
        );
    }

    // Insert sample products
    const products = [
        ['Victorian Ring Set', 'victorian-ring-set', 'Elegant Victorian style ring set', 2999, 3999, 25, 1, '/images/victorian-ring.jpg'],
        ['Color Changing Earrings', 'color-changing-earrings', 'Amazing color changing earrings', 1799, 2200, 18, 3, '/images/color-changing-earrings.jpg'],
        ['Gold Necklace', 'gold-necklace', 'Premium gold necklace', 4500, 5500, 18, 2, '/images/gold-necklace.jpg'],
        ['Diamond Bracelet', 'diamond-bracelet', 'Luxury diamond bracelet', 6200, 7500, 17, 4, '/images/diamond-bracelet.jpg']
    ];

    for (const [name, slug, description, price, original_price, discount, category_id, image] of products) {
        await connection.query(
            'INSERT INTO products (name, slug, description, price, original_price, discount_percentage, category_id, primary_image, stock_quantity, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, slug, description, price, original_price, discount, category_id, image, 10, true]
        );
    }
}

setupAdminDatabase();
