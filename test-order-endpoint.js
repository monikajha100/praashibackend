const axios = require('axios');

async function testOrderEndpoint() {
  try {
    console.log('🔍 Testing order creation endpoint...');
    
    // Test data
    const testOrderData = {
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '1234567890',
      shippingAddress: 'Test Address, Test City',
      billingAddress: 'Test Address, Test City',
      items: [
        {
          productId: 1,
          productName: 'Test Product',
          productPrice: 100,
          quantity: 1,
          totalPrice: 100
        }
      ],
      paymentMethod: 'cod',
      subtotal: 100,
      taxAmount: 18,
      shippingAmount: 0,
      totalAmount: 118,
      notes: 'Test order'
    };
    
    console.log('📝 Test order data:', JSON.stringify(testOrderData, null, 2));
    
    // Make request to order endpoint
    const response = await axios.post('http://localhost:5000/api/orders', testOrderData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Order creation successful!');
    console.log('📋 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
    // Check if order number is present
    const orderNumber = response.data?.order?.order_number;
    if (orderNumber) {
      console.log('✅ Order number found:', orderNumber);
    } else {
      console.log('❌ Order number not found in response!');
      console.log('Available keys in response.data:', Object.keys(response.data || {}));
      if (response.data?.order) {
        console.log('Available keys in response.data.order:', Object.keys(response.data.order));
      }
    }
    
  } catch (error) {
    console.error('❌ Order creation failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
      console.error('Make sure to start the backend server with: npm start');
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

// Run the test
testOrderEndpoint();
