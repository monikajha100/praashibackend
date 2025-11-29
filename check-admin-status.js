const https = require('https');

async function checkAdminStatus() {
  try {
    console.log('=== CHECKING ADMIN FUNCTIONALITY ===');
    
    // Test admin endpoints
    const adminEndpoints = [
      'https://api.praashibysupal.com/api/admin/products',
      'https://api.praashibysupal.com/api/admin/banners',
      'https://api.praashibysupal.com/api/admin/categories',
      'https://api.praashibysupal.com/api/auth/login'
    ];
    
    console.log('\n🔍 Testing Admin Endpoints:');
    
    for (const endpoint of adminEndpoints) {
      console.log(`\n📊 Testing: ${endpoint}`);
      
      try {
        const response = await new Promise((resolve, reject) => {
          const req = https.get(endpoint, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                const jsonData = JSON.parse(data);
                resolve({ 
                  status: res.statusCode, 
                  data: jsonData,
                  headers: res.headers
                });
              } catch (e) {
                resolve({ 
                  status: res.statusCode, 
                  data: data,
                  headers: res.headers
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
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        
        if (response.status === 200) {
          console.log(`   ✅ Working correctly`);
          if (response.data && Array.isArray(response.data)) {
            console.log(`   📊 Data count: ${response.data.length}`);
          }
        } else if (response.status === 401) {
          console.log(`   🔐 Authentication required (expected for admin routes)`);
        } else if (response.status === 500) {
          console.log(`   ❌ Server error: ${response.data.message || 'Unknown error'}`);
        } else {
          console.log(`   ⚠️  Unexpected status: ${response.status}`);
          console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Test login endpoint with sample credentials
    console.log('\n🔐 Testing Admin Login:');
    try {
      const loginData = JSON.stringify({
        email: 'admin@praashibysupal.com',
        password: 'admin123'
      });
      
      const response = await new Promise((resolve, reject) => {
        const req = https.request('https://api.praashibysupal.com/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
          }
        }, (res) => {
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
        req.write(loginData);
        req.end();
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Login request timeout'));
        });
      });
      
      console.log(`   Status: ${response.status}`);
      if (response.status === 200) {
        console.log(`   ✅ Login successful`);
        console.log(`   Token: ${response.data.token ? 'Present' : 'Missing'}`);
        console.log(`   User: ${response.data.user ? response.data.user.email : 'Unknown'}`);
      } else {
        console.log(`   ❌ Login failed: ${response.data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Login error: ${error.message}`);
    }
    
    // Check environment variables that might affect admin
    console.log('\n🔧 Environment Check:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log(`   DEV_ALLOW_NONADMIN: ${process.env.DEV_ALLOW_NONADMIN || 'Not set'}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
    
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
  }
}

checkAdminStatus();
