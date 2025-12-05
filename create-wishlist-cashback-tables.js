const { sequelize } = require('./config/sequelize');
const { DataTypes } = require('sequelize');

// Import models
const Wishlist = require('./models/Wishlist')(sequelize, DataTypes);
const Cashback = require('./models/Cashback')(sequelize, DataTypes);
const Offer = require('./models/Offer')(sequelize, DataTypes);

async function createTables() {
  try {
    console.log('Creating wishlist, cashback, and offers tables...');
    
    await Wishlist.sync({ alter: true });
    console.log('✅ Wishlist table created/updated successfully.');
    
    await Cashback.sync({ alter: true });
    console.log('✅ Cashback table created/updated successfully.');
    
    await Offer.sync({ alter: true });
    console.log('✅ Offer table created/updated successfully.');
    
    console.log('\n✨ All tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

createTables();

