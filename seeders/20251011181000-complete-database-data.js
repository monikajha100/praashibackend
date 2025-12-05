'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Insert categories from your existing database
    await queryInterface.bulkInsert('categories', [
      {
        id: 1,
        name: 'Rings',
        slug: 'rings',
        description: 'Beautiful rings for every occasion',
        is_active: true,
        sort_order: 0,
        created_at: new Date('2025-10-03 05:51:29'),
        updated_at: new Date('2025-10-04 11:04:57')
      },
      {
        id: 2,
        name: 'Necklaces',
        slug: 'necklaces',
        description: 'Elegant necklaces and chains',
        is_active: true,
        sort_order: 2,
        created_at: new Date('2025-10-03 05:51:29'),
        updated_at: new Date('2025-10-03 05:51:29')
      },
      {
        id: 3,
        name: 'Earrings',
        slug: 'earrings',
        description: 'Stylish earrings collection',
        is_active: true,
        sort_order: 3,
        created_at: new Date('2025-10-03 05:51:29'),
        updated_at: new Date('2025-10-03 05:51:29')
      },
      {
        id: 4,
        name: 'Bracelets',
        slug: 'bracelets',
        description: 'Charming bracelets and bangles',
        is_active: true,
        sort_order: 4,
        created_at: new Date('2025-10-03 05:51:29'),
        updated_at: new Date('2025-10-03 05:51:29')
      },
      {
        id: 5,
        name: 'Watches',
        slug: 'watches',
        description: 'Fashionable watches',
        is_active: true,
        sort_order: 5,
        created_at: new Date('2025-10-03 05:51:29'),
        updated_at: new Date('2025-10-03 05:51:29')
      },
      {
        id: 6,
        name: 'Fragrance',
        slug: 'fragrance',
        description: 'Luxury fragrances',
        is_active: true,
        sort_order: 6,
        created_at: new Date('2025-10-03 05:51:29'),
        updated_at: new Date('2025-10-03 05:51:29')
      },
      {
        id: 22,
        name: 'samplee',
        slug: 'samplee',
        description: '',
        is_active: true,
        sort_order: 0,
        created_at: new Date('2025-10-04 13:40:10'),
        updated_at: new Date('2025-10-04 13:40:24')
      },
      {
        id: 23,
        name: 'test',
        slug: 'test',
        description: '',
        is_active: true,
        sort_order: 0,
        created_at: new Date('2025-10-06 18:00:48'),
        updated_at: new Date('2025-10-06 18:00:48')
      },
      {
        id: 24,
        name: 'viraj',
        slug: 'viraj',
        description: '',
        is_active: true,
        sort_order: 0,
        created_at: new Date('2025-10-06 18:01:18'),
        updated_at: new Date('2025-10-06 18:01:18')
      }
    ], {});

    // Insert banners from your existing database
    await queryInterface.bulkInsert('banners', [
      {
        id: 4,
        title: 'Exclusive Collection',
        subtitle: '',
        image: 'https://api.praashibysupal.com/uploads/banners/b1-1759477017588-533462894.jpg',
        link_url: '/products',
        button_text: 'Shop Now',
        is_active: true,
        sort_order: 1,
        created_at: new Date('2025-10-03 07:29:39'),
        updated_at: new Date('2025-10-11 17:18:53')
      },
      {
        id: 9,
        title: 'New Collection',
        subtitle: '',
        image: 'https://api.praashibysupal.com/uploads/banners/banner11-1759667364273-529448503.jpg',
        link_url: '',
        button_text: 'Shop Now',
        is_active: true,
        sort_order: 0,
        created_at: new Date('2025-10-05 12:29:24'),
        updated_at: new Date('2025-10-11 17:18:53')
      },
      {
        id: 10,
        title: 'Collection',
        subtitle: '',
        image: 'https://api.praashibysupal.com/uploads/banners/img07-1760119119787-761735851.jpg',
        link_url: '',
        button_text: 'Shop Now',
        is_active: true,
        sort_order: 0,
        created_at: new Date('2025-10-10 17:58:27'),
        updated_at: new Date('2025-10-11 17:18:53')
      }
    ], {});

    // Insert company settings
    await queryInterface.bulkInsert('company_settings', [
      {
        id: 1,
        setting_key: 'jwt_secret',
        setting_value: 'praashibysupal_jwt_secret_2025',
        description: 'JWT secret key for authentication',
        created_at: new Date('2025-10-11 17:43:37'),
        updated_at: new Date('2025-10-11 17:43:37')
      },
      {
        id: 2,
        setting_key: 'razorpay_key_id',
        setting_value: 'rzp_live_your_key_id',
        description: 'Razorpay live key ID',
        created_at: new Date('2025-10-11 17:43:37'),
        updated_at: new Date('2025-10-11 17:43:37')
      },
      {
        id: 3,
        setting_key: 'razorpay_key_secret',
        setting_value: 'your_razorpay_secret',
        description: 'Razorpay live key secret',
        created_at: new Date('2025-10-11 17:43:37'),
        updated_at: new Date('2025-10-11 17:43:37')
      }
    ], {});

    // Note: You can add more data here from your SQL dump
    // This includes products, product_images, product_colors, orders, etc.
    // I've included the core data to get you started
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('company_settings', null, {});
    await queryInterface.bulkDelete('banners', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  }
};
