module.exports = (sequelize, DataTypes) => {
  const VisitorStat = sequelize.define('VisitorStat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    total_visitors: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    today_visitors: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    last_reset_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_visited_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_visitor_ip: {
      type: DataTypes.STRING(45),
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
    tableName: 'visitor_stats',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return VisitorStat;
};


