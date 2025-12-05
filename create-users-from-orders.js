const { sequelize } = require('./config/sequelize');
const bcrypt = require('bcryptjs');

async function createUsersFromOrders() {
  try {
    console.log('=== CREATING USERS FROM ORDERS ===\n');
    
    // Find all unique customer emails from orders that don't have user accounts
    const [customers] = await sequelize.query(`
      SELECT DISTINCT
        o.customer_email,
        o.customer_name,
        o.customer_phone,
        COUNT(*) as order_count,
        MIN(o.created_at) as first_order_date
      FROM orders o
      LEFT JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(o.customer_email))
      WHERE u.id IS NULL
        AND o.customer_email IS NOT NULL
        AND o.customer_email != ''
        AND o.customer_phone IS NOT NULL
        AND o.customer_phone != ''
      GROUP BY o.customer_email, o.customer_name, o.customer_phone
      ORDER BY order_count DESC, first_order_date ASC
    `);
    
    console.log(`Found ${customers.length} customers with orders but no user accounts\n`);
    
    if (customers.length === 0) {
      console.log('✅ All customers already have user accounts!');
      return;
    }
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const customer of customers) {
      try {
        const email = customer.customer_email.toLowerCase().trim();
        const phone = customer.customer_phone.toString().trim();
        const name = customer.customer_name || email.split('@')[0];
        
        // Skip if phone is invalid
        if (!phone || phone.length < 10) {
          console.log(`⏭️  Skipping ${email} - invalid phone: ${phone}`);
          skipped++;
          continue;
        }
        
        // Check if user was created by another process
        const [existing] = await sequelize.query(
          `SELECT id FROM users WHERE LOWER(TRIM(email)) = ?`,
          { replacements: [email] }
        );
        
        if (existing.length > 0) {
          console.log(`⏭️  Skipping ${email} - user already exists`);
          skipped++;
          continue;
        }
        
        // Normalize phone for password
        const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
        const hashedPassword = await bcrypt.hash(normalizedPhone, 12);
        
        // Create user
        await sequelize.query(
          `INSERT INTO users (name, email, password, phone, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'user', 1, NOW(), NOW())`,
          {
            replacements: [name, email, hashedPassword, phone]
          }
        );
        
        console.log(`✅ Created: ${email} | ${name} | Phone: ${phone} | Orders: ${customer.order_count}`);
        created++;
        
      } catch (error) {
        console.error(`❌ Error creating user for ${customer.customer_email}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`\n✨ Done! All customers can now login with their email and phone number`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

createUsersFromOrders();

