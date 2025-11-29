const db = require('./config/database');

console.log('🔧 Fixing Banner URLs for Local Development');
console.log('============================================');

// Update banner URLs to use local URLs
const updateBanners = async () => {
  try {
    // Get current banners
    const banners = await db.query('SELECT id, title, image FROM banners');
    
    console.log('Current banners:');
    banners.forEach(banner => {
      console.log(`  ${banner.id}: ${banner.title} - ${banner.image}`);
    });
    
    // Update each banner to use local URL
    for (const banner of banners) {
      if (banner.image && banner.image.includes('api.praashibysupal.com')) {
        // Convert production URL to local URL
        const localUrl = banner.image.replace('https://api.praashibysupal.com', 'http://localhost:5000');
        
        await db.query('UPDATE banners SET image = ? WHERE id = ?', [localUrl, banner.id]);
        console.log(`✅ Updated banner ${banner.id}: ${localUrl}`);
      }
    }
    
    console.log('\n✅ All banners updated for local development!');
    console.log('Now restart your backend server and test the frontend.');
    
  } catch (error) {
    console.error('❌ Error updating banners:', error.message);
  }
  
  process.exit(0);
};

updateBanners();
