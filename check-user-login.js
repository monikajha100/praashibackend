const { sequelize } = require('./config/sequelize');
const bcrypt = require('bcryptjs');

async function checkUserLogin() {
  try {
    const email = process.argv[2] || 'suresh@gmail.com';
    const password = process.argv[3] || '';
    
    console.log('=== CHECKING USER LOGIN ===\n');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password || '(not provided)'}\n`);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user
    const [users] = await sequelize.query(
      `SELECT id, email, phone, password, is_active 
       FROM users 
       WHERE LOWER(TRIM(email)) = ?`,
      { replacements: [normalizedEmail] }
    );
    
    if (users.length === 0) {
      console.log('❌ USER NOT FOUND\n');
      
      // Search for similar
      const [similar] = await sequelize.query(
        `SELECT id, email, phone FROM users WHERE email LIKE ? LIMIT 5`,
        { replacements: [`%${normalizedEmail.split('@')[0]}%`] }
      );
      
      if (similar.length > 0) {
        console.log('🔍 Similar users found:');
        similar.forEach(u => console.log(`   - ${u.email} (Phone: ${u.phone || 'N/A'})`));
      }
      return;
    }
    
    const user = users[0];
    
    console.log('✅ USER FOUND:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone || 'N/A'}`);
    console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}\n`);
    
    if (!user.is_active) {
      console.log('❌ ACCOUNT IS DEACTIVATED');
      return;
    }
    
    if (!password) {
      console.log('⚠️  No password provided for testing');
      if (user.phone) {
        const normalized = user.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
        console.log(`\n💡 Try password: ${normalized}`);
      }
      return;
    }
    
    // Test password variants
    const variants = [
      password.trim(),
      password.trim().replace(/[\s\-\(\)]/g, ''),
      password.replace(/\s/g, '')
    ];
    
    if (user.phone) {
      const phoneNorm = user.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
      variants.push(
        user.phone.toString().trim(),
        phoneNorm,
        user.phone.toString().replace(/\s/g, '')
      );
    }
    
    console.log('🔐 TESTING PASSWORD:\n');
    
    let matched = false;
    for (const variant of variants) {
      try {
        const match = await bcrypt.compare(variant, user.password);
        console.log(`   ${match ? '✅' : '❌'} "${variant}"`);
        if (match) {
          matched = true;
          console.log(`\n🎉 SUCCESS! Password matches: "${variant}"`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }
    
    if (!matched) {
      console.log('\n❌ NO MATCH FOUND');
      if (user.phone) {
        const phoneNorm = user.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
        console.log(`\n💡 Suggested password: ${phoneNorm}`);
        console.log(`   Run: node backend/fix-existing-user-passwords.js`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUserLogin();

