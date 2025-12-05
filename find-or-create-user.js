const { sequelize } = require('./config/sequelize');
const bcrypt = require('bcryptjs');

async function findOrCreateUser() {
  try {
    const email = process.argv[2] || 'ramesh@gmail.com';
    const phone = process.argv[3] || '';
    const name = process.argv[4] || 'Ramesh';
    
    console.log('=== FINDING OR CREATING USER ===\n');
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone || '(not provided)'}`);
    console.log(`Name: ${name}\n`);
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Search for user by email (case-insensitive)
    const [users] = await sequelize.query(
      `SELECT id, email, name, phone, password, is_active, created_at 
       FROM users 
       WHERE LOWER(TRIM(email)) = ?`,
      { replacements: [normalizedEmail] }
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log('✅ USER FOUND:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.created_at}`);
      
      if (!phone) {
        console.log('\n💡 To test login, provide phone number:');
        console.log(`   node backend/find-or-create-user.js ${email} 9876543210`);
      } else {
        // Check if password needs updating
        const normalizedPhone = phone.toString().trim().replace(/[\s\-\(\)]/g, '');
        const passwordMatches = await bcrypt.compare(normalizedPhone, user.password);
        
        if (!passwordMatches) {
          console.log('\n⚠️  Password does not match phone number');
          console.log('   Updating password...');
          
          const hashedPassword = await bcrypt.hash(normalizedPhone, 12);
          await sequelize.query(
            `UPDATE users SET password = ? WHERE id = ?`,
            [hashedPassword, user.id]
          );
          
          console.log('✅ Password updated successfully');
          console.log(`   Login with email: ${user.email}`);
          console.log(`   Password: ${normalizedPhone}`);
        } else {
          console.log('\n✅ Password is correct');
          console.log(`   Login with email: ${user.email}`);
          console.log(`   Password: ${normalizedPhone}`);
        }
      }
      
      return;
    }
    
    console.log('❌ USER NOT FOUND\n');
    
    // Search for similar emails
    const [similar] = await sequelize.query(
      `SELECT id, email, name, phone FROM users WHERE email LIKE ? LIMIT 10`,
      { replacements: [`%${normalizedEmail.split('@')[0]}%`] }
    );
    
    if (similar.length > 0) {
      console.log('🔍 Similar users found:');
      similar.forEach(u => {
        console.log(`   - ${u.email} | ${u.name} | Phone: ${u.phone || 'N/A'}`);
      });
      console.log('');
    }
    
    // Check orders for this email
    const [orders] = await sequelize.query(
      `SELECT DISTINCT customer_email, customer_name, customer_phone, COUNT(*) as order_count
       FROM orders 
       WHERE LOWER(customer_email) = ?
       GROUP BY customer_email, customer_name, customer_phone`,
      { replacements: [normalizedEmail] }
    );
    
    if (orders.length > 0) {
      const order = orders[0];
      console.log('📦 FOUND IN ORDERS:');
      console.log(`   Email: ${order.customer_email}`);
      console.log(`   Name: ${order.customer_name}`);
      console.log(`   Phone: ${order.customer_phone || 'N/A'}`);
      console.log(`   Orders: ${order.order_count}`);
      console.log('');
      
      // Create user from order data
      let userPhone = phone || order.customer_phone || '';
      if (userPhone) {
        console.log('🔨 CREATING USER FROM ORDER DATA...\n');
        
        const normalizedPhone = userPhone.toString().trim().replace(/[\s\-\(\)]/g, '');
        const hashedPassword = await bcrypt.hash(normalizedPhone, 12);
        
        const [result] = await sequelize.query(
          `INSERT INTO users (name, email, password, phone, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'user', 1, NOW(), NOW())`,
          {
            replacements: [
              order.customer_name || name,
              normalizedEmail,
              hashedPassword,
              userPhone
            ]
          }
        );
        
        console.log('✅ USER CREATED SUCCESSFULLY!');
        console.log(`   ID: ${result.insertId}`);
        console.log(`   Email: ${normalizedEmail}`);
        console.log(`   Name: ${order.customer_name || name}`);
        console.log(`   Phone: ${phone}`);
        console.log(`\n📱 LOGIN CREDENTIALS:`);
        console.log(`   Email: ${normalizedEmail}`);
        console.log(`   Password: ${normalizedPhone}`);
        return;
      }
    } else {
      console.log('❌ Not found in orders either');
    }
    
    // If phone provided, create user
    if (phone) {
      console.log('🔨 CREATING NEW USER...\n');
      
      const normalizedPhone = phone.toString().trim().replace(/[\s\-\(\)]/g, '');
      const hashedPassword = await bcrypt.hash(normalizedPhone, 12);
      
      const [result] = await sequelize.query(
        `INSERT INTO users (name, email, password, phone, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'user', 1, NOW(), NOW())`,
        {
          replacements: [name, normalizedEmail, hashedPassword, phone]
        }
      );
      
      console.log('✅ USER CREATED SUCCESSFULLY!');
      console.log(`   ID: ${result.insertId}`);
      console.log(`   Email: ${normalizedEmail}`);
      console.log(`   Name: ${name}`);
      console.log(`   Phone: ${phone}`);
      console.log(`\n📱 LOGIN CREDENTIALS:`);
      console.log(`   Email: ${normalizedEmail}`);
      console.log(`   Password: ${normalizedPhone}`);
    } else {
      console.log('\n💡 To create this user, provide phone number:');
      console.log(`   node backend/find-or-create-user.js ${email} 9876543210 "${name}"`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

findOrCreateUser();

