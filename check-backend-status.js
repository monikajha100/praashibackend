const axios = require('axios');

async function checkBackendStatus() {
  try {
    console.log('Checking backend status...');
    
    // Check health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Backend is running:', healthResponse.data);
    
    // Check environment variables
    console.log('\nEnvironment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DEV_ALLOW_NONADMIN:', process.env.DEV_ALLOW_NONADMIN);
    console.log('ADMIN_EMAILS:', process.env.ADMIN_EMAILS);
    
    // Test admin endpoint without auth
    try {
      const adminResponse = await axios.get('http://localhost:5000/api/admin/dashboard');
      console.log('✅ Admin endpoint accessible:', adminResponse.status);
    } catch (error) {
      console.log('❌ Admin endpoint blocked:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.log('❌ Backend not running or not accessible:', error.message);
  }
}

checkBackendStatus();


