const { Order, OrderItem, Product, User } = require('./models');
const { sequelize } = require('./config/sequelize');

async function debugOrderCreation() {
  try {
    console.log('🔍 Starting order creation debug...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test if we can find products
    const products = await Product.findAll({
      where: { is_active: true },
      limit: 3,
      attributes: ['id', 'name', 'price']
    });
    console.log(`✅ Found ${products.length} active products:`, products.map(p => ({ id: p.id, name: p.name, price: p.price })));
    
    if (products.length === 0) {
      console.log('❌ No active products found! This could be the issue.');
      return;
    }
    
    // Test order creation with sample data
    const testOrderData = {
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '1234567890',
      shippingAddress: 'Test Address, Test City',
      billingAddress: 'Test Address, Test City',
      items: [
        {
          productId: products[0].id,
          productName: products[0].name,
          productPrice: parseFloat(products[0].price),
          quantity: 1,
          totalPrice: parseFloat(products[0].price)
        }
      ],
      paymentMethod: 'cod',
      subtotal: parseFloat(products[0].price),
      taxAmount: parseFloat(products[0].price) * 0.18,
      shippingAmount: 0,
      totalAmount: parseFloat(products[0].price) * 1.18,
      notes: 'Debug test order'
    };
    
    console.log('📝 Test order data:', JSON.stringify(testOrderData, null, 2));
    
    // Generate order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now()}`;
    console.log('🔢 Generated order number:', orderNumber);
    
    // Create order
    console.log('🚀 Creating order...');
    const order = await Order.create({
      order_number: orderNumber,
      user_id: null,
      status: 'pending',
      payment_status: 'pending',
      payment_method: testOrderData.paymentMethod,
      subtotal: testOrderData.subtotal,
      tax_amount: testOrderData.taxAmount,
      shipping_amount: testOrderData.shippingAmount,
      total_amount: testOrderData.totalAmount,
      currency: 'INR',
      customer_name: testOrderData.customerName,
      customer_email: testOrderData.customerEmail,
      customer_phone: testOrderData.customerPhone,
      shipping_address: testOrderData.shippingAddress,
      billing_address: testOrderData.billingAddress,
      notes: testOrderData.notes
    });
    
    console.log('✅ Order created successfully!');
    console.log('📋 Order details:', {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      total_amount: order.total_amount
    });
    
    // Create order item
    console.log('🚀 Creating order item...');
    const orderItem = await OrderItem.create({
      order_id: order.id,
      product_id: testOrderData.items[0].productId,
      product_name: testOrderData.items[0].productName,
      product_price: testOrderData.items[0].productPrice,
      original_price: testOrderData.items[0].productPrice,
      quantity: testOrderData.items[0].quantity,
      total_price: testOrderData.items[0].totalPrice
    });
    
    console.log('✅ Order item created successfully!');
    console.log('📋 Order item details:', {
      id: orderItem.id,
      order_id: orderItem.order_id,
      product_id: orderItem.product_id,
      product_name: orderItem.product_name,
      quantity: orderItem.quantity,
      total_price: orderItem.total_price
    });
    
    // Test fetching order with items
    console.log('🚀 Fetching order with items...');
    const orderWithItems = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ]
    });
    
    console.log('✅ Order with items fetched successfully!');
    console.log('📋 Complete order data:', JSON.stringify(orderWithItems.toJSON(), null, 2));
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await OrderItem.destroy({ where: { order_id: order.id } });
    await Order.destroy({ where: { id: order.id } });
    console.log('✅ Test data cleaned up');
    
    console.log('🎉 All tests passed! Order creation is working correctly.');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the debug
debugOrderCreation();
