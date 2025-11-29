const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const InstagramPost = sequelize.define('InstagramPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  instagram_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Instagram post ID if synced'
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  media_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  media_type: {
    type: DataTypes.ENUM('IMAGE', 'VIDEO', 'CAROUSEL'),
    defaultValue: 'IMAGE'
  },
  permalink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  post_type: {
    type: DataTypes.ENUM('FEED', 'STORY', 'REEL'),
    defaultValue: 'FEED'
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'),
    defaultValue: 'DRAFT'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comments_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shares_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reach: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  engagement_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  hashtags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of hashtags used'
  },
  tagged_products: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of product IDs with tag positions'
  },
  is_shoppable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  campaign_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Link to marketing campaign if applicable'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'instagram_posts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = InstagramPost;
