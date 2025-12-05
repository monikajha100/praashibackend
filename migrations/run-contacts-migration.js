const fs = require('fs');
const path = require('path');
const sequelize = require('../config/sequelize').sequelize;

const runMigration = async () => {
  try {
    console.log('Starting contact messages migration...');

    const sqlFile = path.join(__dirname, 'create-contacts-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      console.log('Executing statement:', statement.substring(0, 100) + '...');
      await sequelize.query(statement);
    }

    console.log('✅ Contact messages migration completed successfully!');
    console.log('✅ Tables created: contact_messages, newsletter_subscribers');
    console.log('✅ Sample data inserted');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

runMigration();
