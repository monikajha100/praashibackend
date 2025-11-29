'use strict';

/**
 * Align special offer types to support both legacy and new enum variants.
 *
 * This migration widens the `offer_type` enum so older rows like `flash_sale`
 * keep working, while the application can store the newer semantic values
 * such as `percentage` and `fixed_amount`.
 */

const OFFER_TYPE_ENUM = [
  'percentage',
  'fixed_amount',
  'buy_x_get_y',
  'minimum_purchase',
  'referral',
  'flash_sale',
  'new_arrival',
  'discount_percentage',
  'discount_fixed',
  'free_shipping'
];

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE special_offers
          MODIFY COLUMN offer_type ENUM(${OFFER_TYPE_ENUM.map(type => `'${type}'`).join(', ')})
          NOT NULL DEFAULT 'percentage'
        `,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE special_offers
          MODIFY COLUMN offer_type ENUM(
            'flash_sale',
            'buy_x_get_y',
            'new_arrival',
            'discount_percentage',
            'discount_fixed',
            'free_shipping'
          )
          NOT NULL DEFAULT 'flash_sale'
        `,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};


