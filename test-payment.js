const axios = require('axios');

// Test payment endpoint
const testPayment = async () => {
  try {
    console.log('🧪 Testing Payment and Invoice Generation...\n');
    
    // First, let's get a recent order to test with
    console.log('1. Fetching recent orders...');
    const ordersResponse = await axios.get('http://localhost:5000/api/orders');
    const orders = ordersResponse.data;
    
    if (orders.length === 0) {
      console.log('❌ No orders found. Please create an order first.');
      return;
    }
    
    // Use the most recent order
    const testOrder = orders[0];
    console.log(`✅ Found order: ID ${testOrder.id}, Amount: ₹${testOrder.total_amount}`);
    
    // Test payment
    console.log('\n2. Processing test payment...');
    const paymentResponse = await axios.post('http://localhost:5000/api/payments/test-payment', {
      order_id: testOrder.id,
      amount: testOrder.total_amount
    });
    
    if (paymentResponse.data.success) {
      console.log('✅ Test payment successful!');
      console.log(`   Payment ID: ${paymentResponse.data.payment_id}`);
      console.log(`   Invoice ID: ${paymentResponse.data.invoice.id}`);
      console.log(`   Invoice Number: ${paymentResponse.data.invoice.invoice_number}`);
      
      // Get invoice details
      console.log('\n3. Fetching invoice details...');
      const invoiceResponse = await axios.get(`http://localhost:5000/api/invoices/${paymentResponse.data.invoice.id}`);
      const invoice = invoiceResponse.data;
      
      console.log('✅ Invoice details:');
      console.log(`   Invoice Number: ${invoice.invoice_number}`);
      console.log(`   Customer: ${invoice.customer_name}`);
      console.log(`   Total Amount: ₹${invoice.total_amount}`);
      console.log(`   Payment Status: ${invoice.payment_status}`);
      console.log(`   Items Count: ${invoice.items.length}`);
      
      // Show invoice items
      if (invoice.items && invoice.items.length > 0) {
        console.log('\n📋 Invoice Items:');
        invoice.items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.product_name} - Qty: ${item.quantity} - ₹${item.total_amount}`);
        });
      }
      
      console.log('\n🎉 Test completed successfully!');
      console.log(`\n📄 You can view the invoice at: http://localhost:5000/api/invoices/${paymentResponse.data.invoice.id}`);
      
    } else {
      console.log('❌ Test payment failed:', paymentResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
};

// Run the test
testPayment();


