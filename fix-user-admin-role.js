const db = require('./config/database');

async function fixUserAdminRole(email) {
  try {
    console.log('=== FIXING USER ADMIN ROLE ===\n');
    
    if (!email) {
      console.log('Usage: node fix-user-admin-role.js <email>');
      console.log('Example: node fix-user-admin-role.js admin@praashibysupal.com\n');
      console.log('Listing all users in database:\n');
      
      try {
        const allUsers = await db.query('SELECT id, name, email, role, is_active FROM users ORDER BY id');
        if (allUsers && allUsers.length > 0) {
          console.log(`Found ${allUsers.length} user(s):\n`);
          allUsers.forEach((user, index) => {
            const roleDisplay = user.role || 'NULL';
            const activeDisplay = user.is_active ? 'Active' : 'Inactive';
            const adminStatus = (user.role || '').toString().toLowerCase().trim() === 'admin' ? ' ✅ ADMIN' : '';
            console.log(`   ${index + 1}. ${user.email}`);
            console.log(`      ID: ${user.id} | Name: ${user.name || 'N/A'} | Role: ${roleDisplay} | Status: ${activeDisplay}${adminStatus}`);
          });
          console.log('\n💡 To fix admin role, run:');
          console.log('   node fix-user-admin-role.js <email>\n');
        } else {
          console.log('   No users found in database.\n');
        }
      } catch (error) {
        console.error('   Error listing users:', error.message);
      }
      return;
    }
    
    console.log(`Looking for user with email: ${email}`);
    
    // Find user by email
    const users = await db.query('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
    
    if (!users || users.length === 0) {
      console.log(`❌ User with email "${email}" not found in database.`);
      console.log('\nAvailable users:');
      const allUsers = await db.query('SELECT id, name, email, role FROM users LIMIT 10');
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}, Role: ${user.role || 'NULL'})`);
      });
      return;
    }
    
    const user = users[0];
    console.log(`\n✅ Found user:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role || 'NULL'}`);
    
    // Check if already admin
    const currentRole = (user.role || '').toString().toLowerCase().trim();
    if (currentRole === 'admin') {
      console.log(`\n✅ User already has admin role. No changes needed.`);
      return;
    }
    
    // Update role to admin
    console.log(`\n🔄 Updating role to 'admin'...`);
    await db.query('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id]);
    
    // Verify the update
    const updatedUsers = await db.query('SELECT id, email, role FROM users WHERE id = ?', [user.id]);
    const updatedUser = updatedUsers[0];
    
    console.log(`\n✅ Role updated successfully!`);
    console.log(`   New Role: ${updatedUser.role}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Log out from the admin panel`);
    console.log(`   2. Log back in with email: ${email}`);
    console.log(`   3. You should now have admin access`);
    
  } catch (error) {
    console.error('❌ Error fixing admin role:', error);
    console.error('Error details:', error.message);
  } finally {
    // Close database connection if using connection pool
    if (db.end) {
      await db.end();
    }
  }
}

// Get email from command line arguments
const email = process.argv[2];

fixUserAdminRole(email);

