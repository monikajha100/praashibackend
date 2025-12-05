const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SpecialOffer = sequelize.define('SpecialOffer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '🎁',
    comment: 'Emoji or icon identifier'
  },
  discount_percentage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Discount percentage (0-100)'
  },
  discount_text: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'e.g., "Up to 70% OFF", "Buy 2 Get 1 Free"'
  },
  highlight_text: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Additional highlight or badge text'
  },
  badge_text: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Badge or tag text'
  },
  timer_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Show countdown timer'
  },
  timer_text: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'e.g., "Ends in 24 hours!"'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Offer start date/time'
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Offer end date/time'
  },
  link_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    defaultValue: '/products',
    validate: {
      notEmpty: true
    },
    comment: 'URL when clicked (e.g., /products?sale=true)'
  },
  button_text: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Shop Now'
  },
  background_color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'CSS color value for card background'
  },
  text_color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'CSS color value for text'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Display order (lower first)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  views_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of times viewed'
  },
  clicks_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of times clicked'
  },
  offer_type: {
    type: DataTypes.ENUM(
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
    ),
    allowNull: false,
    defaultValue: 'percentage',
    comment: 'Type of offer'
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Fixed discount amount (for fixed_amount type)'
  },
  minimum_purchase_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Minimum order amount required for offer'
  },
  buy_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Buy quantity for BOGO offers (e.g., buy 2)'
  },
  get_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Get quantity for BOGO offers (e.g., get 1)'
  },
  product_ids: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated product IDs (NULL for all products)'
  },
  category_ids: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated category IDs'
  },
  referral_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Referral code for referral offers'
  },
  max_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Maximum discount amount for percentage offers'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Offer priority (higher = applied first if multiple eligible)'
  },
  stackable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Can this offer be combined with others'
  }
}, {
  tableName: 'special_offers',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['is_active']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['start_date', 'end_date']
    },
    {
      fields: ['offer_type']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['referral_code']
    }
  ]
});

// Instance method to check if offer is currently active
SpecialOffer.prototype.isCurrentlyActive = function() {
  if (!this.is_active) return false;
  
  const now = new Date();
  
  // Check start date
  if (this.start_date && new Date(this.start_date) > now) {
    return false;
  }
  
  // Check end date
  if (this.end_date && new Date(this.end_date) < now) {
    return false;
  }
  
  return true;
};

// Class method to get active offers
SpecialOffer.getActiveOffers = async function() {
  const now = new Date();
  
  return await this.findAll({
    where: {
      is_active: true
    },
    order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
  }).then(offers => {
    return offers.filter(offer => offer.isCurrentlyActive());
  });
};

module.exports = SpecialOffer;
