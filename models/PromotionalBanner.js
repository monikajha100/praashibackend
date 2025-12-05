module.exports = (sequelize, DataTypes) => {
  const PromotionalBanner = sequelize.define('PromotionalBanner', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    text: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    background_color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#000000'
    },
    text_color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#FFFFFF'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    display_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 5000
    },
    device_type: {
      type: DataTypes.ENUM('desktop', 'mobile', 'both'),
      defaultValue: 'both'
    },
    mobile_text: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    mobile_background_color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#000000'
    },
    mobile_text_color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#FFFFFF'
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    mobile_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    link_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    button_text: {
      type: DataTypes.STRING(100),
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
    tableName: 'promotional_banners',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PromotionalBanner;
};
