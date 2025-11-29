'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('instagram_posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      instagram_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Instagram post ID if synced'
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      media_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      media_type: {
        type: Sequelize.ENUM('IMAGE', 'VIDEO', 'CAROUSEL'),
        defaultValue: 'IMAGE'
      },
      permalink: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      post_type: {
        type: Sequelize.ENUM('FEED', 'STORY', 'REEL'),
        defaultValue: 'FEED'
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'),
        defaultValue: 'DRAFT'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      likes_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      comments_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      shares_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      reach: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      impressions: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      engagement_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      hashtags: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of hashtags used'
      },
      tagged_products: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of product IDs with tag positions'
      },
      is_shoppable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      campaign_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Link to marketing campaign if applicable'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    // Add indexes
    await queryInterface.addIndex('instagram_posts', ['instagram_id']);
    await queryInterface.addIndex('instagram_posts', ['status']);
    await queryInterface.addIndex('instagram_posts', ['post_type']);
    await queryInterface.addIndex('instagram_posts', ['is_shoppable']);
    await queryInterface.addIndex('instagram_posts', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('instagram_posts');
  }
};
