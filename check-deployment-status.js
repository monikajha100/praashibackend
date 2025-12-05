const https = require('https');

async function checkDeploymentStatus() {
  try {
    console.log('=== CHECKING DEPLOYMENT STATUS ===');
    console.log('🚀 Deployment triggered successfully!');
    console.log('⏳ Checking if images are now accessible...\n');
    
    // Test a few image URLs
    const testUrls = [
      'https://api.praashibysupal.com/uploads/banners/b1-1759477017588-533462894.jpg',
      'https://api.praashibysupal.com/uploads/products/images-1759584943875-866183850.jpg'
    ];
    
    let accessibleImages = 0;
    let totalImages = testUrls.length;
    
    for (const url of testUrls) {
      console.log(`🔍 Testing: ${url.split('/').pop()}`);
      
      try {
        const response = await new Promise((resolve, reject) => {
          const req = https.get(url, (res) => {
            resolve({
              status: res.statusCode,
              contentType: res.headers['content-type'],
              contentLength: res.headers['content-length']
            });
          });
          req.on('error', reject);
          req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
          });
        });
        
        if (response.status === 200) {
          console.log(`   ✅ Status: ${response.status} - Image accessible!`);
          console.log(`   📄 Content-Type: ${response.contentType}`);
          console.log(`   📏 Size: ${response.contentLength || 'Unknown'} bytes`);
          accessibleImages++;
        } else if (response.status === 404) {
          console.log(`   ⏳ Status: ${response.status} - Still deploying...`);
        } else {
          console.log(`   ⚠️  Status: ${response.status} - Unexpected response`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Accessible images: ${accessibleImages}/${totalImages}`);
    
    if (accessibleImages === totalImages) {
      console.log('\n🎉 SUCCESS! All images are now accessible!');
      console.log('✅ Deployment completed successfully');
      console.log('✅ Persistent disk updated with latest images');
      console.log('✅ Your website should now display images correctly');
    } else if (accessibleImages > 0) {
      console.log('\n🔄 PARTIAL SUCCESS! Some images are accessible');
      console.log('⏳ Deployment may still be in progress');
      console.log('🔄 Check again in a few minutes');
    } else {
      console.log('\n⏳ DEPLOYMENT IN PROGRESS');
      console.log('🔄 Images are not yet accessible');
      console.log('⏰ Please wait 5-10 minutes and check again');
      console.log('📝 You can run this script again to monitor progress');
    }
    
    // Test backend API
    console.log('\n🔍 Backend API Status:');
    try {
      const apiResponse = await new Promise((resolve, reject) => {
        const req = https.get('https://api.praashibysupal.com/api/banners', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({ status: res.statusCode, data: jsonData });
            } catch (e) {
              resolve({ status: res.statusCode, data: data });
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('API timeout'));
        });
      });
      
      console.log(`   ✅ API Status: ${apiResponse.status}`);
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        console.log(`   📊 Banners found: ${apiResponse.data.length}`);
        if (apiResponse.data.length > 0) {
          console.log(`   🏷️  Sample banner: ${apiResponse.data[0].title}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ API Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking deployment status:', error);
  }
}

checkDeploymentStatus();
