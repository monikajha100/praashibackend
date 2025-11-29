module.exports = (sequelize, DataTypes) => {
  const Banner = sequelize.define('Banner', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    link_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    button_text: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    mobile_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    mobile_subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    mobile_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    device_type: {
      type: DataTypes.ENUM('desktop', 'mobile', 'both'),
      defaultValue: 'both'
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
    tableName: 'banners',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Banner;
};
