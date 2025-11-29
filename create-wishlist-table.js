const { sequelize } = require('./config/sequelize');

async function createWishlistTable() {
  try {
    console.log('=== CREATING WISHLIST TABLE ===');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        product_id INT(11) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_product (user_id, product_id),
        KEY idx_user_id (user_id),
        KEY idx_product_id (product_id),
        CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    
    console.log('✅ Wishlist table created successfully!');
  } catch (error) {
    console.error('❌ Error creating wishlist table:', error);
  } finally {
    await sequelize.close();
  }
}

createWishlistTable();















