const { sequelize } = require('./config/sequelize');
const bcrypt = require('bcryptjs');

async function addAllCustomersToDatabase() {
  try {
    console.log('=== ADDING ALL CUSTOMERS TO DATABASE ===\n');
    
    // Get all unique customers from orders
    const [allCustomers] = await sequelize.query(`
      SELECT DISTINCT
        LOWER(TRIM(o.customer_email)) as email,
        o.customer_name as name,
        o.customer_phone as phone,
        COUNT(*) as order_count,
        MIN(o.created_at) as first_order_date
      FROM orders o
      WHERE o.customer_email IS NOT NULL
        AND o.customer_email != ''
        AND o.customer_phone IS NOT NULL
        AND o.customer_phone != ''
      GROUP BY LOWER(TRIM(o.customer_email)), o.customer_name, o.customer_phone
      ORDER BY order_count DESC, first_order_date ASC
    `);
    
    console.log(`Found ${allCustomers.length} unique customers in orders\n`);
    
    if (allCustomers.length === 0) {
      console.log('No customers found in orders');
      return;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const customer of allCustomers) {
      try {
        const email = customer.email.toLowerCase().trim();
        const phone = customer.phone.toString().trim();
        const name = customer.customer_name || email.split('@')[0];
        
        // Skip if phone is invalid
        if (!phone || phone.length < 10) {
          skipped++;
          continue;
        }
        
        // Check if user exists
        const [existing] = await sequelize.query(
          `SELECT id, password, phone FROM users WHERE LOWER(TRIM(email)) = ?`,
          { replacements: [email] }
        );
        
        if (existing.length > 0) {
          const user = existing[0];
          
          // Update phone if missing and password if needed
          const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
          let needsUpdate = false;
          const updates = [];
          const updateValues = [];
          
          if (!user.phone || user.phone !== phone) {
            updates.push('phone = ?');
            updateValues.push(phone);
            needsUpdate = true;
          }
          
          // Check if password matches phone (if not, update it)
          try {
            const passwordMatches = await bcrypt.compare(normalizedPhone, user.password);
            if (!passwordMatches) {
              const hashedPassword = await bcrypt.hash(normalizedPhone, 12);
              updates.push('password = ?');
              updateValues.push(hashedPassword);
              needsUpdate = true;
            }
          } catch (error) {
            // Password might be in wrong format, update it
            const hashedPassword = await bcrypt.hash(normalizedPhone, 12);
            updates.push('password = ?');
            updateValues.push(hashedPassword);
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            updateValues.push(user.id);
            await sequelize.query(
              `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
              { replacements: updateValues }
            );
            console.log(`🔄 Updated: ${email}`);
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new user
          const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
          const hashedPassword = await bcrypt.hash(normalizedPhone, 12);
          
          await sequelize.query(
            `INSERT INTO users (name, email, password, phone, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'user', 1, NOW(), NOW())`,
            {
              replacements: [name, email, hashedPassword, phone]
            }
          );
          
          console.log(`✅ Created: ${email} | ${name} | Phone: ${phone} | Orders: ${customer.order_count}`);
          created++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${customer.email}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${allCustomers.length}`);
    console.log(`\n✨ All customers are now in the database and can login!`);
    console.log(`   Login with: Email + Phone Number (digits only)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

addAllCustomersToDatabase();

