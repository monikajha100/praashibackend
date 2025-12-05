const { sequelize } = require('./config/sequelize');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function testUserLogin() {
  try {
    console.log('=== TESTING USER LOGIN ===\n');
    
    // Get email and password from command line arguments
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.log('Usage: node test-user-login.js <email> <password>');
      console.log('Example: node test-user-login.js user@example.com 9876543210');
      process.exit(1);
    }
    
    console.log(`Testing login for: ${email}`);
    console.log(`Password entered: ${password}\n`);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user
    const user = await User.findOne({ where: { email: normalizedEmail } });
    
    if (!user) {
      console.log('❌ USER NOT FOUND');
      console.log(`Searched for email: ${normalizedEmail}`);
      
      // Try to find similar emails
      const similarUsers = await User.findAll({
        where: {
          email: {
            [require('sequelize').Op.like]: `%${normalizedEmail.split('@')[0]}%`
          }
        },
        attributes: ['id', 'email', 'phone']
      });
      
      if (similarUsers.length > 0) {
        console.log('\n🔍 Similar users found:');
        similarUsers.forEach(u => {
          console.log(`   - ${u.email} (Phone: ${u.phone || 'N/A'})`);
        });
      }
      
      process.exit(1);
    }
    
    console.log('✅ USER FOUND:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone || 'N/A'}`);
    console.log(`   Is Active: ${user.is_active}`);
    console.log(`   Password Hash: ${user.password.substring(0, 20)}...\n`);
    
    if (!user.is_active) {
      console.log('❌ ACCOUNT IS DEACTIVATED');
      process.exit(1);
    }
    
    // Normalize password input
    const normalizedPassword = password.toString().trim().replace(/[\s\-\(\)]/g, '');
    
    // Build password variants to try
    const passwordVariants = [
      { name: 'Original (trimmed)', value: password.toString().trim() },
      { name: 'Fully normalized', value: normalizedPassword },
      { name: 'No spaces only', value: password.toString().replace(/\s/g, '') },
    ];
    
    // If user has a phone number, also try normalized versions
    if (user.phone) {
      const phoneNormalized = user.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
      passwordVariants.push(
        { name: 'User phone (original)', value: user.phone.toString().trim() },
        { name: 'User phone (normalized)', value: phoneNormalized },
        { name: 'User phone (no spaces)', value: user.phone.toString().replace(/\s/g, '') }
      );
    }
    
    console.log('🔐 TESTING PASSWORD VARIANTS:\n');
    
    let foundMatch = false;
    for (const variant of passwordVariants) {
      try {
        const matches = await bcrypt.compare(variant.value, user.password);
        const status = matches ? '✅ MATCH' : '❌ No match';
        console.log(`   ${status} - ${variant.name}: ${variant.value}`);
        
        if (matches) {
          foundMatch = true;
          console.log(`\n🎉 LOGIN SUCCESS!`);
          console.log(`   Use this password format: ${variant.value}`);
          break;
        }
      } catch (error) {
        console.log(`   ❌ Error testing "${variant.name}": ${error.message}`);
      }
    }
    
    if (!foundMatch) {
      console.log('\n❌ NO PASSWORD MATCH FOUND');
      console.log('\n💡 SUGGESTIONS:');
      console.log('   1. Check if the password was stored correctly');
      console.log('   2. The user may need to reset their password');
      console.log('   3. Run: node backend/fix-existing-user-passwords.js');
      
      // Show what password should be based on phone
      if (user.phone) {
        const phoneNormalized = user.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
        console.log(`\n📱 User phone: ${user.phone}`);
        console.log(`   Expected password (normalized): ${phoneNormalized}`);
        console.log(`   Try logging in with: ${phoneNormalized}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

testUserLogin();

