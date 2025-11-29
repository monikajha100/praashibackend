module.exports = (sequelize, DataTypes) => {
  const PromotionalOffer = sequelize.define('PromotionalOffer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    offer_type: {
      type: DataTypes.ENUM('flash_sale', 'buy_x_get_y', 'new_arrival', 'discount_percentage', 'discount_fixed', 'free_shipping'),
      allowNull: false
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      defaultValue: 'percentage'
    },
    minimum_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    maximum_discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    buy_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    get_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    icon: {
      type: DataTypes.STRING(50),
      defaultValue: '?'
    },
    background_color: {
      type: DataTypes.STRING(7),
      defaultValue: '#FF6B6B'
    },
    text_color: {
      type: DataTypes.STRING(7),
      defaultValue: '#FFFFFF'
    },
    button_color: {
      type: DataTypes.STRING(7),
      defaultValue: '#FFB6C1'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'promotional_offers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Instance method to check if offer is currently active
  PromotionalOffer.prototype.isCurrentlyActive = function() {
    if (!this.is_active) return false;
    const now = new Date();
    if (this.starts_at && new Date(this.starts_at) > now) return false;
    if (this.expires_at && new Date(this.expires_at) < now) return false;
    return true;
  };

  // Static method to get active offers
  PromotionalOffer.getActiveOffers = async function() {
    const { Op } = require('sequelize');
    const now = new Date();
    return await this.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { starts_at: null },
          { starts_at: { [Op.lte]: now } }
        ],
        [Op.and]: [
          {
            [Op.or]: [
              { expires_at: null },
              { expires_at: { [Op.gte]: now } }
            ]
          }
        ]
      },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
  };

  return PromotionalOffer;
};

