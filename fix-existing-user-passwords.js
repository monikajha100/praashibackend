const { sequelize } = require('./config/sequelize');
const bcrypt = require('bcryptjs');

async function fixExistingUserPasswords() {
  try {
    console.log('=== FIXING EXISTING USER PASSWORDS ===');
    console.log('Updating passwords for users who have phone numbers...\n');
    
    // Get all users with phone numbers
    const [users] = await sequelize.query(`
      SELECT id, email, phone, password 
      FROM users 
      WHERE phone IS NOT NULL AND phone != ''
      ORDER BY id
    `);
    
    console.log(`Found ${users.length} users with phone numbers\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        // Normalize phone number (remove spaces, dashes, parentheses)
        const normalizedPhone = user.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
        
        // Check if password might already be this phone number
        // We'll try to verify by attempting bcrypt compare with normalized phone
        let shouldUpdate = true;
        
        try {
          // Try to see if current password matches normalized phone
          const matches = await bcrypt.compare(normalizedPhone, user.password);
          if (matches) {
            console.log(`✓ User ${user.email}: Password already matches normalized phone`);
            skipped++;
            shouldUpdate = false;
          }
        } catch (error) {
          // Continue to update
        }
        
        if (shouldUpdate) {
          // Hash the normalized phone number
          const hashedPassword = await bcrypt.hash(normalizedPhone, 12);
          
          // Update user password
          await sequelize.query(
            `UPDATE users SET password = ? WHERE id = ?`,
            [hashedPassword, user.id]
          );
          
          console.log(`✅ Updated password for ${user.email}`);
          console.log(`   Phone: ${user.phone} → Normalized: ${normalizedPhone}`);
          updated++;
        }
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`\n✨ Done! Users can now login with their email and phone number (digits only)`);
    
  } catch (error) {
    console.error('❌ Error fixing user passwords:', error);
  } finally {
    await sequelize.close();
  }
}

fixExistingUserPasswords();

