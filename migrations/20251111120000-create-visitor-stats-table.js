'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('visitor_stats', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      total_visitors: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      today_visitors: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      last_reset_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Tracks when the daily counter was last reset'
      },
      last_visited_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_visitor_ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'Stores last visitor IP (supports IPv6)'
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

    await queryInterface.addIndex('visitor_stats', ['last_reset_at']);
    await queryInterface.addIndex('visitor_stats', ['last_visited_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('visitor_stats');
  }
};


