const axios = require('axios');

async function quickTest() {
  try {
    console.log('🧪 Quick Payment & Invoice Test\n');
    
    // Test payment for order 61
    console.log('Processing test payment for order 61...');
    const response = await axios.post('http://localhost:5000/api/payments/test-payment', {
      order_id: 61,
      amount: 1767.64
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.invoice) {
      console.log('\n📄 Invoice created successfully!');
      console.log(`Invoice ID: ${response.data.invoice.id}`);
      console.log(`Invoice Number: ${response.data.invoice.invoice_number}`);
      
      // Get invoice details
      const invoiceResponse = await axios.get(`http://localhost:5000/api/invoices/${response.data.invoice.id}`);
      console.log('\n📋 Invoice Details:');
      console.log(`Customer: ${invoiceResponse.data.customer_name || 'N/A'}`);
      console.log(`Total: ₹${invoiceResponse.data.total_amount}`);
      console.log(`Status: ${invoiceResponse.data.payment_status}`);
      console.log(`Items: ${invoiceResponse.data.items?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

quickTest();

















