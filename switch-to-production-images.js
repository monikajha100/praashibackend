const db = require('./backend/config/database');

console.log('🌐 Switching image URLs back to production...');

// Fix product images
db.query(`
  UPDATE product_images 
  SET image_url = REPLACE(image_url, 'http://localhost:5000', 'https://api.praashibysupal.com')
  WHERE image_url LIKE 'http://localhost:5000%'
`, (err, result) => {
  if (err) {
    console.error('❌ Error updating product images:', err);
  } else {
    console.log(`✅ Updated ${result.affectedRows} product images to production URLs`);
  }
  
  // Fix banner images
  db.query(`
    UPDATE banners 
    SET image = REPLACE(image, 'http://localhost:5000', 'https://api.praashibysupal.com')
    WHERE image LIKE 'http://localhost:5000%'
  `, (err, result) => {
    if (err) {
      console.error('❌ Error updating banner images:', err);
    } else {
      console.log(`✅ Updated ${result.affectedRows} banner images to production URLs`);
    }
    
    console.log('\n🎉 Image URLs switched back to production!');
    process.exit(0);
  });
});





