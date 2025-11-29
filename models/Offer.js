module.exports = (sequelize, DataTypes) => {
  const Offer = sequelize.define('Offer', {
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
      type: DataTypes.ENUM('discount', 'cashback', 'free_shipping', 'bogo'),
      allowNull: false
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    cashback_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    min_purchase_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    max_discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: false
    },
    valid_to: {
      type: DataTypes.DATE,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    coupon_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    tableName: 'offers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Offer;
};

