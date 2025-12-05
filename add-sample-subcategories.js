const mysql = require('mysql2/promise');
require('dotenv').config({ path: './env.local' });

const addSampleSubcategories = async () => {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'praashibysupal_db'
    });

    console.log('✅ Connected to database');

    // First, get existing categories
    const [categories] = await connection.execute('SELECT id, name FROM categories ORDER BY id');
    console.log('📋 Found categories:', categories);

    if (categories.length === 0) {
      console.log('❌ No categories found. Please add categories first.');
      return;
    }

    // Sample subcategories data
    const sampleSubcategories = [
      // Rings subcategories
      { category_name: 'Rings', name: 'Engagement Rings', slug: 'engagement-rings', description: 'Beautiful engagement rings for your special moment', sort_order: 1 },
      { category_name: 'Rings', name: 'Wedding Bands', slug: 'wedding-bands', description: 'Classic and modern wedding bands', sort_order: 2 },
      { category_name: 'Rings', name: 'Fashion Rings', slug: 'fashion-rings', description: 'Trendy fashion rings for everyday wear', sort_order: 3 },
      { category_name: 'Rings', name: 'Cocktail Rings', slug: 'cocktail-rings', description: 'Statement rings for special occasions', sort_order: 4 },

      // Necklaces subcategories
      { category_name: 'Necklaces', name: 'Pendant Necklaces', slug: 'pendant-necklaces', description: 'Elegant pendant necklaces with various designs', sort_order: 1 },
      { category_name: 'Necklaces', name: 'Chain Necklaces', slug: 'chain-necklaces', description: 'Classic chain necklaces in different styles', sort_order: 2 },
      { category_name: 'Necklaces', name: 'Choker Necklaces', slug: 'choker-necklaces', description: 'Modern choker necklaces for contemporary look', sort_order: 3 },
      { category_name: 'Necklaces', name: 'Lariat Necklaces', slug: 'lariat-necklaces', description: 'Stylish lariat necklaces for unique style', sort_order: 4 },

      // Earrings subcategories
      { category_name: 'Earrings', name: 'Stud Earrings', slug: 'stud-earrings', description: 'Classic stud earrings for everyday elegance', sort_order: 1 },
      { category_name: 'Earrings', name: 'Hoop Earrings', slug: 'hoop-earrings', description: 'Versatile hoop earrings in various sizes', sort_order: 2 },
      { category_name: 'Earrings', name: 'Drop Earrings', slug: 'drop-earrings', description: 'Elegant drop earrings for special occasions', sort_order: 3 },
      { category_name: 'Earrings', name: 'Ear Cuffs', slug: 'ear-cuffs', description: 'Modern ear cuffs for edgy style', sort_order: 4 },

      // Bracelets subcategories
      { category_name: 'Bracelets', name: 'Bangle Bracelets', slug: 'bangle-bracelets', description: 'Classic bangle bracelets for wrist elegance', sort_order: 1 },
      { category_name: 'Bracelets', name: 'Chain Bracelets', slug: 'chain-bracelets', description: 'Stylish chain bracelets in various designs', sort_order: 2 },
      { category_name: 'Bracelets', name: 'Cuff Bracelets', slug: 'cuff-bracelets', description: 'Bold cuff bracelets for statement look', sort_order: 3 },
      { category_name: 'Bracelets', name: 'Charm Bracelets', slug: 'charm-bracelets', description: 'Personalized charm bracelets with meaning', sort_order: 4 },

      // Watches subcategories
      { category_name: 'Watches', name: 'Luxury Watches', slug: 'luxury-watches', description: 'High-end luxury timepieces', sort_order: 1 },
      { category_name: 'Watches', name: 'Sports Watches', slug: 'sports-watches', description: 'Durable watches for active lifestyle', sort_order: 2 },
      { category_name: 'Watches', name: 'Smart Watches', slug: 'smart-watches', description: 'Modern smart watches with technology', sort_order: 3 },
      { category_name: 'Watches', name: 'Vintage Watches', slug: 'vintage-watches', description: 'Classic vintage timepieces', sort_order: 4 },

      // Brooches subcategories
      { category_name: 'Brooches', name: 'Vintage Brooches', slug: 'vintage-brooches', description: 'Classic vintage brooches with history', sort_order: 1 },
      { category_name: 'Brooches', name: 'Modern Brooches', slug: 'modern-brooches', description: 'Contemporary brooch designs', sort_order: 2 },
      { category_name: 'Brooches', name: 'Floral Brooches', slug: 'floral-brooches', description: 'Beautiful floral-inspired brooches', sort_order: 3 },
      { category_name: 'Brooches', name: 'Animal Brooches', slug: 'animal-brooches', description: 'Cute animal-themed brooches', sort_order: 4 },

      // Pendants subcategories
      { category_name: 'Pendants', name: 'Religious Pendants', slug: 'religious-pendants', description: 'Sacred symbols and religious pendants', sort_order: 1 },
      { category_name: 'Pendants', name: 'Initial Pendants', slug: 'initial-pendants', description: 'Personalized initial pendants', sort_order: 2 },
      { category_name: 'Pendants', name: 'Gemstone Pendants', slug: 'gemstone-pendants', description: 'Beautiful pendants with precious stones', sort_order: 3 },
      { category_name: 'Pendants', name: 'Symbol Pendants', slug: 'symbol-pendants', description: 'Meaningful symbol pendants', sort_order: 4 },

      // Sets subcategories
      { category_name: 'Sets', name: 'Bridal Sets', slug: 'bridal-sets', description: 'Complete bridal jewelry sets', sort_order: 1 },
      { category_name: 'Sets', name: 'Evening Sets', slug: 'evening-sets', description: 'Elegant sets for evening wear', sort_order: 2 },
      { category_name: 'Sets', name: 'Casual Sets', slug: 'casual-sets', description: 'Everyday jewelry sets', sort_order: 3 },
      { category_name: 'Sets', name: 'Gift Sets', slug: 'gift-sets', description: 'Perfect jewelry gift sets', sort_order: 4 },

      // Men's Jewelry subcategories
      { category_name: 'Men\'s Jewelry', name: 'Men\'s Rings', slug: 'mens-rings', description: 'Stylish rings for men', sort_order: 1 },
      { category_name: 'Men\'s Jewelry', name: 'Men\'s Chains', slug: 'mens-chains', description: 'Bold chains for men', sort_order: 2 },
      { category_name: 'Men\'s Jewelry', name: 'Men\'s Bracelets', slug: 'mens-bracelets', description: 'Masculine bracelet designs', sort_order: 3 },
      { category_name: 'Men\'s Jewelry', name: 'Men\'s Watches', slug: 'mens-watches', description: 'Professional watches for men', sort_order: 4 }
    ];

    // Create a map of category names to IDs
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    console.log('🗺️ Category mapping:', categoryMap);

    // Insert subcategories
    let insertedCount = 0;
    let skippedCount = 0;

    for (const subcategory of sampleSubcategories) {
      const categoryId = categoryMap[subcategory.category_name];
      
      if (!categoryId) {
        console.log(`⚠️ Category "${subcategory.category_name}" not found, skipping subcategory "${subcategory.name}"`);
        skippedCount++;
        continue;
      }

      try {
        // Check if subcategory already exists
        const [existing] = await connection.execute(
          'SELECT id FROM subcategories WHERE name = ? AND category_id = ?',
          [subcategory.name, categoryId]
        );

        if (existing.length > 0) {
          console.log(`⏭️ Subcategory "${subcategory.name}" already exists, skipping`);
          skippedCount++;
          continue;
        }

        // Insert new subcategory
        await connection.execute(
          'INSERT INTO subcategories (category_id, name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [categoryId, subcategory.name, subcategory.slug, subcategory.description, subcategory.sort_order, 1]
        );

        console.log(`✅ Added subcategory: "${subcategory.name}" under "${subcategory.category_name}"`);
        insertedCount++;
      } catch (error) {
        console.log(`❌ Error adding subcategory "${subcategory.name}":`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Inserted: ${insertedCount} subcategories`);
    console.log(`⏭️ Skipped: ${skippedCount} subcategories`);

    // Show final count
    const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM subcategories');
    console.log(`📈 Total subcategories in database: ${finalCount[0].count}`);

    // Show sample of inserted subcategories
    const [sampleSubcategories] = await connection.execute(`
      SELECT 
        s.id,
        s.name as subcategory_name,
        s.slug,
        c.name as category_name,
        s.description,
        s.is_active
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY c.name, s.sort_order
      LIMIT 10
    `);

    console.log('\n📋 Sample subcategories:');
    sampleSubcategories.forEach(sub => {
      console.log(`  - ${sub.subcategory_name} (${sub.category_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the script
addSampleSubcategories();
