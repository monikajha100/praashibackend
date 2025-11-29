const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Development bypass middleware
const devBypass = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_ALLOW_NONADMIN === 'true') {
    req.user = {
      userId: 1,
      email: process.env.ADMIN_EMAIL || 'admin@local.dev',
      role: 'admin'
    };
    return next();
  }
  return authenticateToken(req, res, next);
};

const devBypassAdmin = async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_ALLOW_NONADMIN === 'true') {
    return next();
  }
  return requireAdmin(req, res, next);
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Dashboard stats
router.get('/dashboard', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM products WHERE is_active = 1'),
      db.query('SELECT COUNT(*) as count FROM orders'),
      db.query('SELECT COUNT(*) as count FROM users WHERE role = "user"'),
      db.query('SELECT SUM(total_amount) as total FROM orders WHERE payment_status = "paid"'),
      db.query(`
        SELECT o.*, u.name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `),
      db.query('SELECT * FROM products WHERE stock_quantity < 10 AND is_active = 1 LIMIT 5')
    ]);

    res.json({
      stats: {
        totalProducts: totalProducts[0].count,
        totalOrders: totalOrders[0].count,
        totalUsers: totalUsers[0].count,
        totalRevenue: totalRevenue[0].total || 0
      },
      recentOrders: recentOrders,
      lowStockProducts: lowStockProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Get all products for admin
router.get('/products', devBypass, devBypassAdmin, async (req, res) => {
  try {
    console.log('=== Admin GET /products route hit ===');
    console.log('User:', req.user ? { 
      id: req.user.userId || req.user.id, 
      email: req.user.email, 
      role: req.user.role,
      fullUser: req.user
    } : 'No user');
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    const products = await db.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    
    console.log(`Found ${products.length} products`);
    
    // Get colors for each product
    for (let product of products) {
      try {
        const colors = await db.query(`
          SELECT * FROM product_colors 
          WHERE product_id = ? AND is_active = 1 
          ORDER BY sort_order, id
        `, [product.id]);
        product.colors = colors || [];
      } catch (colorError) {
        console.error(`Error fetching colors for product ${product.id}:`, colorError);
        product.colors = [];
      }
    }
    
    console.log(`Returning ${products.length} products to admin`);
    
    // Ensure we always return an array, even if empty
    if (!Array.isArray(products)) {
      console.warn('Products query did not return an array, converting...');
      products = [];
    }
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get single product by ID for admin (includes inactive products)
// IMPORTANT: This route must be defined BEFORE router.post('/products') to avoid route conflicts
// Route: GET /api/admin/products/:id
router.get('/products/:id', devBypass, devBypassAdmin, async (req, res) => {
  try {
    console.log('=== Admin GET /products/:id route hit ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    console.log('Request params:', req.params);
    const { id } = req.params;
    console.log('Fetching product with ID:', id);
    
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const [product] = await db.query(sql, [id]);
    if (!product) {
      console.log('Product not found for ID:', id);
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log('Product found:', product.id, product.name);
    
    // Get all images for the product
    const images = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, is_primary DESC',
      [product.id]
    );
    
    console.log('Found images:', images.length);
    console.log('Images data:', images);
    
    // Also check if there's a primary_image on the product itself
    if (images.length === 0 && product.primary_image) {
      console.log('No images in product_images table, but product has primary_image:', product.primary_image);
      // Add the primary_image as a fallback
      images.push({
        id: null,
        product_id: product.id,
        image_url: product.primary_image,
        is_primary: 1,
        sort_order: 0
      });
      console.log('Added primary_image as fallback, total images now:', images.length);
    }
    
    // Get colors for the product
    const colors = await db.query(`
      SELECT * FROM product_colors 
      WHERE product_id = ? 
      ORDER BY sort_order, id
    `, [product.id]);
    
    const response = {
      ...product,
      images,
      colors
    };
    
    console.log('Sending response with', images.length, 'images');
    res.json(response);
  } catch (error) {
    console.error('Error fetching admin product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Product management routes
router.post('/products', devBypass, devBypassAdmin, upload.array('images', 5), [
  body('name').trim().isLength({ min: 2 }).withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category_id').isInt().withMessage('Valid category is required'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Valid stock quantity is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description = '',
      short_description = '',
      category_id,
      price,
      original_price = null,
      sku = '',
      stock_quantity = 0,
      weight = null,
      dimensions = null,
      material = null,
      color = null,
      is_featured = false,
      homepage_section = 'none',
      meta_title = null,
      meta_description = null
    } = req.body;

    // Generate unique SKU if not provided or empty
    let finalSku = sku;
    if (!finalSku || finalSku.trim() === '') {
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      finalSku = `SKU-${timestamp}-${randomNum}`;
    }
    
    // Ensure SKU is unique
    let skuExists = true;
    let skuCounter = 1;
    let tempSku = finalSku;
    while (skuExists) {
      const existing = await db.query('SELECT id FROM products WHERE sku = ?', [tempSku]);
      if (existing.length === 0) {
        skuExists = false;
        finalSku = tempSku;
      } else {
        tempSku = `${finalSku}-${skuCounter}`;
        skuCounter++;
      }
    }

    // Generate slug and ensure uniqueness
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if slug already exists and append number if needed
    let slugExists = true;
    let slugCounter = 1;
    let finalSlug = slug;
    while (slugExists) {
      const existing = await db.query('SELECT id FROM products WHERE slug = ?', [finalSlug]);
      if (existing.length === 0) {
        slugExists = false;
      } else {
        finalSlug = `${slug}-${slugCounter}`;
        slugCounter++;
      }
    }
    slug = finalSlug;

    // Calculate discount percentage
    const discount_percentage = original_price && parseFloat(original_price) > parseFloat(price) 
      ? Math.round(((parseFloat(original_price) - parseFloat(price)) / parseFloat(original_price)) * 100) 
      : 0;

    const images = [];

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        // Generate full URL based on environment
        const imageUrl = process.env.NODE_ENV === 'production' 
          ? `https://api.praashibysupal.com/uploads/products/${file.filename}`
          : `http://localhost:5000/uploads/products/${file.filename}`;
        
        images.push(imageUrl);
      }
    }

    const primaryImage = images.length > 0 ? images[0] : null;

    // Ensure proper data types and handle null values
    const processedCategoryId = category_id ? parseInt(category_id) : null;
    const processedPrice = parseFloat(price) || 0;
    const processedOriginalPrice = original_price ? parseFloat(original_price) : null;
    const processedStockQuantity = parseInt(stock_quantity) || 0;
    const processedWeight = weight ? parseFloat(weight) : null;
    const processedIsFeatured = is_featured === true || is_featured === 'true' || is_featured === '1' ? 1 : 0;
    const processedHomepageSection = homepage_section || 'none';

    // Create product
    const result = await db.query(`
      INSERT INTO products (
        name, slug, description, short_description, category_id, price, original_price,
        discount_percentage, sku, stock_quantity, weight, dimensions, material, color,
        is_featured, homepage_section, is_active, meta_title, meta_description, primary_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, slug, description || '', short_description || '', processedCategoryId, processedPrice, processedOriginalPrice,
      discount_percentage, finalSku, processedStockQuantity, processedWeight, dimensions || null, material || null, color || null,
      processedIsFeatured, processedHomepageSection, 1, meta_title || null, meta_description || null, primaryImage
    ]);

    const productId = result.insertId || result[0]?.insertId;

    if (!productId) {
      throw new Error('Failed to retrieve product ID after creation');
    }

    // Handle image uploads
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {        
        await db.query(
          'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [productId, images[i], i === 0 ? 1 : 0, i]
        );
      }
    }

    // Handle product colors
    if (req.body.colors && Array.isArray(req.body.colors)) {
      for (const colorData of req.body.colors) {
        if (colorData.color_name && colorData.color_name.trim() !== '') {
          await db.query(`
            INSERT INTO product_colors (product_id, color_name, color_code, color_image, is_primary, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            productId,
            colorData.color_name,
            colorData.color_code || null,
            colorData.color_image || null,
            colorData.is_primary || false,
            colorData.sort_order || 0
          ]);
        }
      }
    }

    res.status(201).json({ message: 'Product created successfully', productId });
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlState: error.sqlState,
      errno: error.errno
    });
    
    // Provide more specific error messages
    let errorMessage = 'Error creating product';
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage?.includes('slug')) {
        errorMessage = 'A product with this name already exists. Please use a different name.';
      } else if (error.sqlMessage?.includes('sku')) {
        errorMessage = 'A product with this SKU already exists. Please use a different SKU.';
      } else {
        errorMessage = 'A product with this information already exists.';
      }
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Invalid category selected. Please select a valid category.';
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      errorMessage = 'Required fields are missing. Please fill in all required fields.';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sql: error.sql,
        sqlState: error.sqlState
      } : undefined
    });
  }
});

// Update product
router.put('/products/:productId', devBypass, devBypassAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description = '',
      short_description = '',
      category_id,
      subcategory_id,
      price,
      original_price = null,
      sku = '',
      stock_quantity = 0,
      weight = null,
      dimensions = null,
      material = null,
      color = null,
      is_featured = false,
      homepage_section = 'none',
      is_active = true,
      meta_title = null,
      meta_description = null
    } = req.body;

    // Generate unique SKU if not provided or empty
    let finalSku = sku;
    if (!finalSku || finalSku.trim() === '') {
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      finalSku = `SKU-${timestamp}-${randomNum}`;
    }
    
    // Ensure SKU is unique (for updates, allow same SKU for same product)
    const existingWithSku = await db.query('SELECT id FROM products WHERE sku = ? AND id != ?', [finalSku, productId]);
    if (existingWithSku.length > 0) {
      // Append product ID to make it unique
      finalSku = `${finalSku}-${productId}`;
    }

    // Generate slug - for updates, only change if name changed
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if slug already exists for a different product
    const existingWithSlug = await db.query('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, productId]);
    if (existingWithSlug.length > 0) {
      // Append product ID to make it unique
      slug = `${slug}-${productId}`;
    }

    // Calculate discount percentage
    const discount_percentage = original_price && parseFloat(original_price) > parseFloat(price) 
      ? Math.round(((parseFloat(original_price) - parseFloat(price)) / parseFloat(original_price)) * 100) 
      : 0;

    // Ensure proper data types and handle null values
    const processedCategoryId = category_id ? parseInt(category_id) : null;
    const processedSubcategoryId = subcategory_id ? parseInt(subcategory_id) : null;
    
    // Validate subcategory_id exists if provided (to prevent foreign key constraint error)
    if (processedSubcategoryId !== null) {
      const subcategoryCheck = await db.query('SELECT id FROM subcategories WHERE id = ?', [processedSubcategoryId]);
      if (subcategoryCheck.length === 0) {
        return res.status(400).json({ 
          message: `Invalid subcategory_id: ${processedSubcategoryId}. The subcategory does not exist.` 
        });
      }
    }
    
    const processedPrice = parseFloat(price) || 0;
    const processedOriginalPrice = original_price ? parseFloat(original_price) : null;
    const processedStockQuantity = parseInt(stock_quantity) || 0;
    const processedWeight = weight ? parseFloat(weight) : null;
    const processedIsFeatured = is_featured === true || is_featured === 'true' || is_featured === '1' ? 1 : 0;
    const processedIsActive = is_active === true || is_active === 'true' || is_active === '1' ? 1 : 0;
    const processedHomepageSection = homepage_section || 'none';

    // Update product
    await db.query(`
      UPDATE products SET
        name = ?, slug = ?, description = ?, short_description = ?, category_id = ?, subcategory_id = ?,
        price = ?, original_price = ?, discount_percentage = ?, sku = ?, stock_quantity = ?,
        weight = ?, dimensions = ?, material = ?, color = ?, is_featured = ?,
        homepage_section = ?, is_active = ?, meta_title = ?, meta_description = ?
      WHERE id = ?
    `, [
      name, slug, description || '', short_description || '', processedCategoryId, processedSubcategoryId, 
      processedPrice, processedOriginalPrice, discount_percentage, finalSku, processedStockQuantity, 
      processedWeight, dimensions || null, material || null, color || null,
      processedIsFeatured, processedHomepageSection, processedIsActive, meta_title || null, meta_description || null, productId
    ]);

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        // Generate full URL based on environment (consistent with create route)
        const imageUrl = process.env.NODE_ENV === 'production' 
          ? `https://api.praashibysupal.com/uploads/products/${file.filename}`
          : `http://localhost:5000/uploads/products/${file.filename}`;
        
        // Get current max sort_order to append new images
        const existingImages = await db.query(
          'SELECT MAX(sort_order) as max_order FROM product_images WHERE product_id = ?',
          [productId]
        );
        const nextSortOrder = existingImages[0]?.max_order !== null && existingImages[0]?.max_order !== undefined 
          ? (existingImages[0].max_order + 1) 
          : 0;
        
        await db.query(
          'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, 0, ?)',
          [productId, imageUrl, nextSortOrder + i]
        );
      }
    }

    // Handle product colors update
    if (req.body.colors !== undefined) {
      // Delete existing colors
      await db.query('DELETE FROM product_colors WHERE product_id = ?', [productId]);
      
      // Add new colors
      if (Array.isArray(req.body.colors)) {
        for (const colorData of req.body.colors) {
          if (colorData.color_name && colorData.color_name.trim() !== '') {
            await db.query(`
              INSERT INTO product_colors (product_id, color_name, color_code, color_image, is_primary, sort_order)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              productId,
              colorData.color_name,
              colorData.color_code || null,
              colorData.color_image || null,
              colorData.is_primary || false,
              colorData.sort_order || 0
            ]);
          }
        }
      }
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlState: error.sqlState,
      errno: error.errno
    });
    
    // Provide more specific error messages
    let errorMessage = 'Error updating product';
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage?.includes('slug')) {
        errorMessage = 'A product with this name already exists. Please use a different name.';
      } else if (error.sqlMessage?.includes('sku')) {
        errorMessage = 'A product with this SKU already exists. Please use a different SKU.';
      } else {
        errorMessage = 'A product with this information already exists.';
      }
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Invalid category selected. Please select a valid category.';
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      errorMessage = 'Required fields are missing. Please fill in all required fields.';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sql: error.sql,
        sqlState: error.sqlState
      } : undefined
    });
  }
});

// Delete product image
router.delete('/products/images/:imageId', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { imageId } = req.params;

    // Get image info before deleting
    const [image] = await db.query('SELECT * FROM product_images WHERE id = ?', [imageId]);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from database
    await db.query('DELETE FROM product_images WHERE id = ?', [imageId]);

    // Optionally delete the file from filesystem (if needed)
    // const fs = require('fs');
    // const path = require('path');
    // const imagePath = path.join(__dirname, '..', 'uploads', 'products', path.basename(image.image_url));
    // if (fs.existsSync(imagePath)) {
    //   fs.unlinkSync(imagePath);
    // }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({ message: 'Error deleting product image' });
  }
});

// Delete product
router.delete('/products/:productId', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { productId } = req.params;

    await db.query('DELETE FROM products WHERE id = ?', [productId]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Category management
router.post('/categories', devBypass, devBypassAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Category name is required')
], async (req, res) => {
  try {
    console.log('Category creation request received');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, sort_order } = req.body;
    
    // Ensure name is not undefined
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Set default values and ensure no undefined values
    const finalDescription = description || '';
    const finalSortOrder = sort_order || 0;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    console.log('Category creation values:', { name, slug, description: finalDescription, sort_order: finalSortOrder });
    
    // Log the exact parameters being passed to the database
    const dbParams = [name, slug, finalDescription, finalSortOrder];
    console.log('Database parameters:', dbParams);
    console.log('Parameter types:', dbParams.map(p => typeof p));
    console.log('Parameter undefined check:', dbParams.map(p => p === undefined));

    const result = await db.query(
      'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)',
      dbParams
    );

    res.status(201).json({ message: 'Category created successfully', categoryId: result.insertId });
  } catch (error) {
    console.error('Error creating category:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// Update category
router.put('/categories/:categoryId', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description = '', sort_order = 0, is_active = true } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await db.query(
      'UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [name, slug, description, sort_order, is_active === 'true' ? 1 : 0, categoryId]
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete category
router.delete('/categories/:categoryId', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Check if category has products
    const products = await db.query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [categoryId]);
    
    if (products[0].count > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing products' });
    }

    await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// Site settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await db.query('SELECT * FROM site_settings');
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Update site settings
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

module.exports = router;
