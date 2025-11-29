const db = require('../config/database');

async function createTestCoupon() {
  try {
    console.log('Creating test coupon...');
    
    const testCoupon = {
      code: 'TEST10',
      name: 'Test Coupon 10% Off',
      type: 'percentage',
      value: 10,
      min_order_amount: 100,
      max_discount: 500,
      usage_limit: 1000,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      target_audience: 'all',
      description: 'Test coupon for checkout testing - 10% off on orders above ₹100',
      status: 'active'
    };

    // Check if coupon already exists
    const existing = await db.query('SELECT id FROM coupons WHERE code = ?', [testCoupon.code]);
    const existingCoupon = Array.isArray(existing) && existing.length > 0 ? existing[0] : existing;
    
    if (existingCoupon) {
      console.log('Test coupon already exists with code:', testCoupon.code);
      // Update with correct column names
      await db.query(`
        UPDATE coupons 
        SET 
          name = ?,
          type = ?,
          value = ?,
          min_order_amount = ?,
          max_discount_amount = ?,
          usage_limit = ?,
          start_date = ?,
          end_date = ?,
          description = ?,
          is_active = ?
        WHERE code = ?
      `, [
        testCoupon.name,
        testCoupon.type,
        testCoupon.value,
        testCoupon.min_order_amount,
        testCoupon.max_discount,
        testCoupon.usage_limit,
        testCoupon.start_date + ' 00:00:00',
        testCoupon.end_date + ' 23:59:59',
        testCoupon.description,
        testCoupon.status === 'active' ? 1 : 0,
        testCoupon.code
      ]);
      console.log('✅ Test coupon updated successfully!');
    } else {
      // Create new coupon with correct column names
      const result = await db.query(`
        INSERT INTO coupons (
          code, name, type, value, min_order_amount,
          max_discount_amount, usage_limit, start_date, end_date,
          description, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testCoupon.code,
        testCoupon.name,
        testCoupon.type,
        testCoupon.value,
        testCoupon.min_order_amount,
        testCoupon.max_discount,
        testCoupon.usage_limit,
        testCoupon.start_date + ' 00:00:00',
        testCoupon.end_date + ' 23:59:59',
        testCoupon.description,
        testCoupon.status === 'active' ? 1 : 0
      ]);

      console.log('✅ Test coupon created successfully!');
      console.log('Coupon ID:', result.insertId);
    }

    console.log('\n📋 Test Coupon Details:');
    console.log('Code:', testCoupon.code);
    console.log('Name:', testCoupon.name);
    console.log('Discount:', testCoupon.value + '%');
    console.log('Min Order:', '₹' + testCoupon.min_order_amount);
    console.log('Max Discount:', '₹' + testCoupon.max_discount);
    console.log('Usage Limit:', testCoupon.usage_limit);
    console.log('Valid until:', testCoupon.end_date);
    console.log('\n💡 Use this coupon code in checkout: TEST10');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test coupon:', error);
    process.exit(1);
  }
}

createTestCoupon();

