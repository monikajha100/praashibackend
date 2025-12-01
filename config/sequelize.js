const { Sequelize } = require('sequelize');
let sequelize;

if (process.env.DATABASE_URL) {
  // Production environment on Render
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Render connections
      }
    },
    logging: false
  });
} else {
  // Local development environment
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false
    }
  );
}
