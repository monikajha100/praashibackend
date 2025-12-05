const https = require('https');

async function testAdminFix() {
  try {
    console.log('=== TESTING ADMIN FIX ===');
    
    // Test the fixed categories endpoint
    console.log('\n🔍 Testing Fixed Categories Endpoint:');
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.get('https://api.praashibysupal.com/api/categories', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({ 
                status: res.statusCode, 
                data: jsonData
              });
            } catch (e) {
              resolve({ 
                status: res.statusCode, 
                data: data
              });
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   ✅ Categories endpoint working!`);
        if (response.data && Array.isArray(response.data)) {
          console.log(`   📊 Categories found: ${response.data.length}`);
          if (response.data.length > 0) {
            console.log(`   🏷️  Sample category: ${response.data[0].name}`);
            console.log(`   📊 Product count: ${response.data[0].product_count || 'N/A'}`);
          }
        }
      } else {
        console.log(`   ❌ Categories endpoint failed: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test admin categories endpoint
    console.log('\n🔍 Testing Admin Categories Endpoint:');
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.get('https://api.praashibysupal.com/api/categories/admin', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({ 
                status: res.statusCode, 
                data: jsonData
              });
            } catch (e) {
              resolve({ 
                status: res.statusCode, 
                data: data
              });
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   ✅ Admin categories endpoint working!`);
        if (response.data && Array.isArray(response.data)) {
          console.log(`   📊 Categories found: ${response.data.length}`);
        }
      } else {
        console.log(`   ❌ Admin categories endpoint failed: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test admin products endpoint
    console.log('\n🔍 Testing Admin Products Endpoint:');
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.get('https://api.praashibysupal.com/api/admin/products', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({ 
                status: res.statusCode, 
                data: jsonData
              });
            } catch (e) {
              resolve({ 
                status: res.statusCode, 
                data: data
              });
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   ✅ Admin products endpoint working!`);
        if (response.data && Array.isArray(response.data)) {
          console.log(`   📊 Products found: ${response.data.length}`);
        }
      } else if (response.status === 401) {
        console.log(`   🔐 Authentication required (expected)`);
      } else {
        console.log(`   ❌ Admin products endpoint failed: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing admin fix:', error);
  }
}

testAdminFix();
