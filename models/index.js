const { sequelize } = require('../config/sequelize');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./User')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const Subcategory = require('./Subcategory')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const ProductImage = require('./ProductImage')(sequelize, DataTypes);
const ProductColor = require('./ProductColor')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const OrderItem = require('./OrderItem')(sequelize, DataTypes);
const Banner = require('./Banner')(sequelize, DataTypes);
const PromotionalBanner = require('./PromotionalBanner')(sequelize, DataTypes);
const CompanySetting = require('./CompanySetting')(sequelize, DataTypes);
const Contact = require('./Contact')(sequelize, DataTypes);
const UserAddress = require('./UserAddress')(sequelize, DataTypes);
const Wishlist = require('./Wishlist')(sequelize, DataTypes);
const PromotionalOffer = require('./PromotionalOffer')(sequelize, DataTypes);
const Cashback = require('./Cashback')(sequelize, DataTypes);
const Offer = require('./Offer')(sequelize, DataTypes);
const VisitorStat = require('./VisitorStat')(sequelize, DataTypes);

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
  User.hasMany(UserAddress, { foreignKey: 'user_id', as: 'addresses' });
  User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlist' });
  User.hasMany(Cashback, { foreignKey: 'user_id', as: 'cashbacks' });
  
  // UserAddress associations
  UserAddress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  
  // Wishlist associations
  Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Wishlist.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  
  // Category associations
  Category.hasMany(Subcategory, { foreignKey: 'category_id', as: 'subcategories' });
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
  
  // Subcategory associations
  Subcategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Subcategory.hasMany(Product, { foreignKey: 'subcategory_id', as: 'products' });
  
  // Product associations
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Product.belongsTo(Subcategory, { foreignKey: 'subcategory_id', as: 'subcategory' });
  Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'productImages' });
  Product.hasMany(ProductColor, { foreignKey: 'product_id', as: 'colors' });
  Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
  Product.hasMany(Wishlist, { foreignKey: 'product_id', as: 'wishlistItems' });
  
  // ProductImage associations
  ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  
  // ProductColor associations
  ProductColor.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  
  // Order associations
  Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
  Order.hasMany(Cashback, { foreignKey: 'order_id', as: 'cashbacks' });
  
  // OrderItem associations
  OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  
  // Cashback associations
  Cashback.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Cashback.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
};

// Initialize associations
defineAssociations();

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Category,
  Subcategory,
  Product,
  ProductImage,
  ProductColor,
  Order,
  OrderItem,
  Banner,
  PromotionalBanner,
  CompanySetting,
  Contact,
  UserAddress,
  Wishlist,
  PromotionalOffer,
  Cashback,
  Offer,
  VisitorStat
};