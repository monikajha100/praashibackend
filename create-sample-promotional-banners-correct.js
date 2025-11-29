const { PromotionalBanner } = require('./models');

async function createSamplePromotionalBanners() {
  try {
    console.log('Creating sample promotional banners...');

    // Check if promotional banners already exist
    const existingBanners = await PromotionalBanner.count();
    if (existingBanners > 0) {
      console.log('Promotional banners already exist. Skipping creation.');
      return;
    }

    // Create sample promotional banners
    const sampleBanners = [
      {
        text: 'Free Shipping On Orders ₹ 999 & Above',
        background_color: '#000000',
        text_color: '#FFFFFF',
        sort_order: 1,
        display_duration: 5000,
        is_active: true
      },
      {
        text: 'New Collection Just Arrived!',
        background_color: '#2C2C2C',
        text_color: '#FFFFFF',
        sort_order: 2,
        display_duration: 5000,
        is_active: true
      },
      {
        text: 'Special Offer: 20% Off on Earrings',
        background_color: '#D4AF37',
        text_color: '#FFFFFF',
        sort_order: 3,
        display_duration: 5000,
        is_active: true
      },
      {
        text: 'Become a Partner',
        background_color: '#28a745',
        text_color: '#FFFFFF',
        sort_order: 4,
        display_duration: 5000,
        is_active: true
      }
    ];

    // Create promotional banners
    for (const bannerData of sampleBanners) {
      await PromotionalBanner.create(bannerData);
      console.log(`Created promotional banner: ${bannerData.text}`);
    }

    console.log('Sample promotional banners created successfully!');
    console.log('You can now manage promotional banners from the admin panel at /admin/promotional-banners');

  } catch (error) {
    console.error('Error creating sample promotional banners:', error);
  }
}

// Run the function
createSamplePromotionalBanners().then(() => {
  console.log('Promotional banner creation process completed.');
  process.exit(0);
}).catch(error => {
  console.error('Failed to create sample promotional banners:', error);
  process.exit(1);
});

