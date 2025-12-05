const axios = require('axios');

async function testBannerAPIs() {
  try {
    console.log('Testing banners API...');
    const bannersResponse = await axios.get('http://localhost:5000/api/banners');
    console.log('Banners API response:', bannersResponse.data);
    console.log('Type of response:', typeof bannersResponse.data);
    console.log('Is array:', Array.isArray(bannersResponse.data));
    
    console.log('\nTesting promotional banners API...');
    const promoBannersResponse = await axios.get('http://localhost:5000/api/promotional-banners');
    console.log('Promotional banners API response:', promoBannersResponse.data);
    console.log('Type of response:', typeof promoBannersResponse.data);
    console.log('Is array:', Array.isArray(promoBannersResponse.data));
    
    console.log('\nTesting admin banners API...');
    const adminBannersResponse = await axios.get('http://localhost:5000/api/admin/banners');
    console.log('Admin banners API response:', adminBannersResponse.data);
    console.log('Type of response:', typeof adminBannersResponse.data);
    console.log('Is array:', Array.isArray(adminBannersResponse.data));
    
    console.log('\nTesting admin promotional banners API...');
    const adminPromoBannersResponse = await axios.get('http://localhost:5000/api/admin/promotional-banners');
    console.log('Admin promotional banners API response:', adminPromoBannersResponse.data);
    console.log('Type of response:', typeof adminPromoBannersResponse.data);
    console.log('Is array:', Array.isArray(adminPromoBannersResponse.data));
  } catch (error) {
    console.error('Error testing APIs:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testBannerAPIs();