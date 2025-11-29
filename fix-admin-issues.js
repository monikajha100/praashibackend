const { sequelize } = require('./config/sequelize');

async function fixAdminIssues() {
  try {
    console.log('=== FIXING ADMIN ISSUES ===');
    
    // 1. Check if admin user exists
    console.log('\n1. Checking Admin User:');
    const [adminUsers] = await sequelize.query(`
      SELECT id, name, email, role, is_active 
      FROM users 
      WHERE email = 'admin@praashibysupal.com' OR role = 'admin'
    `);
    
    if (adminUsers.length > 0) {
      console.log(`   ✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(user => {
        console.log(`      - ${user.email} (${user.role}) - Active: ${user.is_active}`);
      });
    } else {
      console.log('   ❌ No admin users found');
    }
    
    // 2. Check categories table
    console.log('\n2. Checking Categories:');
    const [categories] = await sequelize.query('SELECT COUNT(*) as count FROM categories');
    console.log(`   📊 Total categories: ${categories[0].count}`);
    
    const [activeCategories] = await sequelize.query('SELECT COUNT(*) as count FROM categories WHERE is_active = 1');
    console.log(`   📊 Active categories: ${activeCategories[0].count}`);
    
    // 3. Check products table
    console.log('\n3. Checking Products:');
    const [products] = await sequelize.query('SELECT COUNT(*) as count FROM products');
    console.log(`   📊 Total products: ${products[0].count}`);
    
    const [activeProducts] = await sequelize.query('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    console.log(`   📊 Active products: ${activeProducts[0].count}`);
    
    // 4. Check banners table
    console.log('\n4. Checking Banners:');
    const [banners] = await sequelize.query('SELECT COUNT(*) as count FROM banners');
    console.log(`   📊 Total banners: ${banners[0].count}`);
    
    const [activeBanners] = await sequelize.query('SELECT COUNT(*) as count FROM banners WHERE is_active = 1');
    console.log(`   📊 Active banners: ${activeBanners[0].count}`);
    
    // 5. Test simple category query
    console.log('\n5. Testing Simple Category Query:');
    try {
      const [simpleCategories] = await sequelize.query(`
        SELECT id, name, slug, is_active, sort_order 
        FROM categories 
        WHERE is_active = 1 
        ORDER BY sort_order ASC, name ASC
      `);
      console.log(`   ✅ Simple query successful: ${simpleCategories.length} categories`);
      if (simpleCategories.length > 0) {
        console.log(`   Sample: ${simpleCategories[0].name}`);
      }
    } catch (error) {
      console.log(`   ❌ Simple query failed: ${error.message}`);
    }
    
    // 6. Check for missing data
    console.log('\n6. Data Completeness Check:');
    
    if (adminUsers.length === 0) {
      console.log('   ⚠️  No admin users - need to create admin user');
    }
    
    if (categories[0].count === 0) {
      console.log('   ⚠️  No categories - need to add categories');
    }
    
    if (products[0].count === 0) {
      console.log('   ⚠️  No products - need to add products');
    }
    
    if (banners[0].count === 0) {
      console.log('   ⚠️  No banners - need to add banners');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin issues:', error);
  } finally {
    await sequelize.close();
  }
}

fixAdminIssues();
