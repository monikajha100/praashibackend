const axios = require('axios');

async function testAdminOrders() {
  try {
    console.log('🔍 Testing admin orders endpoint...');
    
    // Test the admin orders endpoint
    const response = await axios.get('http://localhost:5000/api/orders/admin/all', {
      params: {
        page: 1,
        limit: 10
      },
      timeout: 10000
    });
    
    console.log('✅ Admin orders endpoint successful!');
    console.log('📋 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
    // Check if orders are present
    const orders = response.data?.orders || [];
    console.log(`📊 Found ${orders.length} orders`);
    
    if (orders.length > 0) {
      console.log('📋 Sample order:', {
        id: orders[0].id,
        order_number: orders[0].order_number,
        customer_name: orders[0].customer_name,
        status: orders[0].status,
        total_amount: orders[0].total_amount
      });
    }
    
  } catch (error) {
    console.error('❌ Admin orders endpoint failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

// Run the test
testAdminOrders();
