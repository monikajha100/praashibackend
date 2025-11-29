const db = require('./backend/config/database');

console.log('🔧 Quick fix for local image URLs...');

// Fix product images
db.query(`
  UPDATE product_images 
  SET image_url = REPLACE(image_url, 'https://api.praashibysupal.com', 'http://localhost:5000')
  WHERE image_url LIKE 'https://api.praashibysupal.com%'
`, (err, result) => {
  if (err) {
    console.error('❌ Error updating product images:', err);
  } else {
    console.log(`✅ Updated ${result.affectedRows} product images`);
  }
  
  // Fix banner images
  db.query(`
    UPDATE banners 
    SET image = REPLACE(image, 'https://api.praashibysupal.com', 'http://localhost:5000')
    WHERE image LIKE 'https://api.praashibysupal.com%'
  `, (err, result) => {
    if (err) {
      console.error('❌ Error updating banner images:', err);
    } else {
      console.log(`✅ Updated ${result.affectedRows} banner images`);
    }
    
    console.log('\n🎉 Image URLs fixed! Your images should now display locally.');
    process.exit(0);
  });
});





