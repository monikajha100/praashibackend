const { sequelize } = require('./config/sequelize');

async function createPromotionalBannersTable() {
  try {
    console.log('Creating promotional_banners table...');

    // Create the promotional_banners table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS promotional_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        image VARCHAR(500) NOT NULL,
        link_url VARCHAR(500),
        button_text VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('promotional_banners table created successfully!');

    // Now create sample data
    const { PromotionalBanner } = require('./models');

    // Check if promotional banners already exist
    const existingBanners = await PromotionalBanner.count();
    if (existingBanners > 0) {
      console.log('Promotional banners already exist. Skipping creation.');
      return;
    }

    // Create sample promotional banners
    const sampleBanners = [
      {
        title: 'Free Shipping On Orders ₹ 999 & Above',
        subtitle: 'Shop now and get free delivery',
        image: 'https://via.placeholder.com/1200x200/000000/FFFFFF?text=Free+Shipping+On+Orders+₹+999+%26+Above',
        link_url: '/products',
        button_text: 'Shop Now',
        sort_order: 1,
        is_active: true
      },
      {
        title: 'New Collection Just Arrived!',
        subtitle: 'Discover our latest jewelry pieces',
        image: 'https://via.placeholder.com/1200x200/2C2C2C/FFFFFF?text=New+Collection+Just+Arrived!',
        link_url: '/products?category=necklaces',
        button_text: 'Explore',
        sort_order: 2,
        is_active: true
      },
      {
        title: 'Special Offer: 20% Off on Earrings',
        subtitle: 'Limited time offer - Don\'t miss out!',
        image: 'https://via.placeholder.com/1200x200/D4AF37/FFFFFF?text=Special+Offer:+20%25+Off+on+Earrings',
        link_url: '/products?category=earrings',
        button_text: 'Get Offer',
        sort_order: 3,
        is_active: true
      },
      {
        title: 'Become a Partner',
        subtitle: 'Join our partner program and earn more',
        image: 'https://via.placeholder.com/1200x200/28a745/FFFFFF?text=Become+a+Partner',
        link_url: '/partner',
        button_text: 'Join Now',
        sort_order: 4,
        is_active: true
      }
    ];

    // Create promotional banners
    for (const bannerData of sampleBanners) {
      await PromotionalBanner.create(bannerData);
      console.log(`Created promotional banner: ${bannerData.title}`);
    }

    console.log('Sample promotional banners created successfully!');
    console.log('You can now manage promotional banners from the admin panel at /admin/promotional-banners');

  } catch (error) {
    console.error('Error creating promotional banners table:', error);
  }
}

// Run the function
createPromotionalBannersTable().then(() => {
  console.log('Promotional banners setup process completed.');
  process.exit(0);
}).catch(error => {
  console.error('Failed to setup promotional banners:', error);
  process.exit(1);
});

