const axios = require('axios');

// Create a test order first
const createTestOrder = async () => {
  try {
    console.log('🛒 Creating test order...\n');
    
    // First, let's get a product to add to the order
    console.log('1. Fetching products...');
    const productsResponse = await axios.get('http://localhost:5000/api/products');
    const products = productsResponse.data.products || productsResponse.data;
    
    if (!products || products.length === 0) {
      console.log('❌ No products found. Please add products first.');
      return;
    }
    
    // Use the first product
    const testProduct = products[0];
    console.log(`✅ Found product: ${testProduct.name} - ₹${testProduct.price}`);
    
    // Create test order
    console.log('\n2. Creating test order...');
    const orderData = {
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '9876543210',
      shippingAddress: '123 Test Street, Test City, Test State, 123456, India',
      billingAddress: '123 Test Street, Test City, Test State, 123456, India',
      items: [
        {
          productId: testProduct.id,
          quantity: 2
        }
      ],
      paymentMethod: 'test_payment',
      subtotal: testProduct.price * 2,
      taxAmount: (testProduct.price * 2) * 0.18, // 18% GST
      shippingAmount: 0,
      totalAmount: (testProduct.price * 2) * 1.18,
      notes: 'Test order for invoice generation'
    };
    
    const orderResponse = await axios.post('http://localhost:5000/api/orders', orderData);
    
    if (orderResponse.data.message === 'Order created successfully') {
      console.log('✅ Test order created successfully!');
      console.log(`   Order ID: ${orderResponse.data.order.id}`);
      console.log(`   Order Number: ${orderResponse.data.order.order_number}`);
      console.log(`   Total Amount: ₹${orderResponse.data.order.total_amount}`);
      
      // Now test payment
      console.log('\n3. Testing payment...');
      const paymentResponse = await axios.post('http://localhost:5000/api/payments/test-payment', {
        order_id: orderResponse.data.order.id,
        amount: orderResponse.data.order.total_amount
      });
      
      if (paymentResponse.data.success) {
        console.log('✅ Test payment successful!');
        console.log(`   Payment ID: ${paymentResponse.data.payment_id}`);
        console.log(`   Invoice ID: ${paymentResponse.data.invoice.id}`);
        console.log(`   Invoice Number: ${paymentResponse.data.invoice.invoice_number}`);
        
        // Get invoice details
        console.log('\n4. Fetching invoice details...');
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
      
    } else {
      console.log('❌ Test order creation failed:', orderResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
};

// Run the test
createTestOrder();
