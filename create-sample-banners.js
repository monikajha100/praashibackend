const { Banner } = require('./models');

async function createSampleBanners() {
  try {
    console.log('Creating sample banners...');

    // Check if banners already exist
    const existingBanners = await Banner.count();
    if (existingBanners > 0) {
      console.log('Banners already exist. Skipping creation.');
      return;
    }

    // Create sample banners
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

    // Create banners
    for (const bannerData of sampleBanners) {
      await Banner.create(bannerData);
      console.log(`Created banner: ${bannerData.title}`);
    }

    console.log('Sample banners created successfully!');
    console.log('You can now manage banners from the admin panel at /admin/banners');

  } catch (error) {
    console.error('Error creating sample banners:', error);
  }
}

// Run the function
createSampleBanners().then(() => {
  console.log('Banner creation process completed.');
  process.exit(0);
}).catch(error => {
  console.error('Failed to create sample banners:', error);
  process.exit(1);
});

