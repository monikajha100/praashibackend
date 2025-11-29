module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define('Contact', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING(255),
      defaultValue: 'General Inquiry'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('new', 'read', 'responded', 'archived'),
      defaultValue: 'new'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    response_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'contact_messages',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
      { fields: ['priority'] }
    ]
  });

  // Instance methods
  Contact.prototype.markAsRead = async function() {
    this.is_read = true;
    if (this.status === 'new') {
      this.status = 'read';
    }
    await this.save();
  };

  Contact.prototype.markAsResponded = async function(notes) {
    this.status = 'responded';
    this.responded_at = new Date();
    if (notes) {
      this.response_notes = notes;
    }
    await this.save();
  };

  // Static methods
  Contact.getUnreadCount = async function() {
    return await this.count({ where: { is_read: false } });
  };

  Contact.getByStatus = async function(status, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    return await this.findAndCountAll({
      where: { status },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  };

  Contact.getStatistics = async function() {
    const total = await this.count();
    const unread = await this.count({ where: { is_read: false } });
    const byStatus = await sequelize.query(
      'SELECT status, COUNT(*) as count FROM contact_messages GROUP BY status',
      { type: sequelize.QueryTypes.SELECT }
    );
    const byPriority = await sequelize.query(
      'SELECT priority, COUNT(*) as count FROM contact_messages GROUP BY priority',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    return {
      total,
      unread,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item.count }), {}),
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item.count }), {})
    };
  };

  return Contact;
};