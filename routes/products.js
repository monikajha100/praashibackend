const express = require('express');
const router = express.Router();
const db = require('../config/database');
const mysql = require('mysql2');
const { body, validationResult } = require('express-validator');

// Get all products with pagination and filters (SIMPLIFIED VERSION)
router.get('/', async (req, res) => {
  try {
    console.log('=== PRODUCTS API REQUEST ===');
    
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      featured
    } = req.query;

    // Log search parameter for debugging
    if (search) {
      console.log('Search query received:', search);
      console.log('Search query type:', typeof search);
      console.log('Search query trimmed:', search.trim());
    }

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE p.is_active = 1';
    let params = [];

    // Category filter (from URL parameter - only apply if not already set by search)
    // Note: Search category match will override this
    if (category && !search) {
      whereClause += ' AND c.slug = ?';
      params.push(category);
    }

    // Subcategory filter
    if (subcategory) {
      whereClause += ' AND s.slug = ?';
      params.push(subcategory);
    }

    // Search filter - category-first matching (applies to ALL categories)
    // When searching for any category name (e.g., "earrings", "necklaces", "rings", "bracelets", etc.),
    // only show products from that specific category
    // Priority: If search term exactly matches a category name/slug, show ONLY that category's products
    // Otherwise, search in product names and SKU
    let categoryMatch = null;
    if (search) {
      const trimmedSearch = search.trim();
      const searchTerm = `%${trimmedSearch}%`;
      const exactSearch = trimmedSearch.toLowerCase();
      
      // First, check if search term exactly matches ANY category name or slug
      // This works for all categories: earrings, necklaces, rings, bracelets, watches, fragrance, etc.
      // If it matches, ONLY show products from that category (strict filtering)
      // This ensures category searches are precise (e.g., "earrings" only shows earrings, not necklaces)
      try {
        // Try multiple variations to catch the category
        const categoryCheckResult = await db.query(
          'SELECT id, name, slug FROM categories WHERE LOWER(TRIM(name)) = ? OR LOWER(TRIM(slug)) = ? OR name = ? OR slug = ? LIMIT 1',
          [exactSearch, exactSearch, trimmedSearch, trimmedSearch]
        );
        
        console.log(`Category check query executed for: "${trimmedSearch}" (exactSearch: "${exactSearch}")`);
        console.log('Category check result:', categoryCheckResult);
        
        // Handle different result formats from database
        if (Array.isArray(categoryCheckResult)) {
          categoryMatch = categoryCheckResult.length > 0 ? categoryCheckResult[0] : null;
          console.log(`Category check - Array result, length: ${categoryCheckResult.length}`);
        } else if (categoryCheckResult && categoryCheckResult.id) {
          categoryMatch = categoryCheckResult;
          console.log(`Category check - Single result object found`);
        } else {
          categoryMatch = null;
          console.log(`Category check - No match found`);
        }
        
        if (categoryMatch && categoryMatch.id) {
          // Exact category match found - ONLY show products from this specific category
          // This applies to all categories: earrings, necklaces, rings, bracelets, watches, fragrance, etc.
          whereClause += ' AND c.id = ?';
          params.push(categoryMatch.id);
          console.log(`✅ Category search match: "${trimmedSearch}" matched category "${categoryMatch.name}" (ID: ${categoryMatch.id}, slug: ${categoryMatch.slug})`);
        } else {
          // No exact category match - search in product names and SKU only
          whereClause += ' AND (LOWER(p.name) LIKE ? OR LOWER(p.sku) LIKE ?)';
          const lowerSearchTerm = searchTerm.toLowerCase();
          params.push(lowerSearchTerm, lowerSearchTerm);
          console.log(`❌ No category match for "${trimmedSearch}", searching in product names and SKU instead`);
        }
      } catch (categoryCheckError) {
        // If category check fails, fall back to regular product name/SKU search
        console.error('Error checking category match:', categoryCheckError);
        whereClause += ' AND (LOWER(p.name) LIKE ? OR LOWER(p.sku) LIKE ?)';
        const lowerSearchTerm = searchTerm.toLowerCase();
        params.push(lowerSearchTerm, lowerSearchTerm);
        console.log(`Category check failed, falling back to product name/SKU search for "${trimmedSearch}"`);
      }
    }

    // Price filters - Fixed: Handle empty strings and validate numeric values
    if (minPrice && minPrice !== '' && !isNaN(parseFloat(minPrice))) {
      whereClause += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice && maxPrice !== '' && !isNaN(parseFloat(maxPrice))) {
      whereClause += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Featured filter
    if (featured === 'true') {
      whereClause += ' AND p.is_featured = 1';
    }

    // Sort validation
    const allowedSortFields = ['name', 'price', 'created_at', 'discount_percentage'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // SIMPLIFIED QUERY - No colors for now to prevent crashes
    // Add relevance scoring for search results (only if not filtering by exact category match)
    let relevanceSelect = '';
    let relevanceOrder = '';
    if (search && !categoryMatch) {
      // Only use relevance scoring if we didn't find an exact category match
      try {
        const trimmedSearch = search.trim().toLowerCase();
        const escapedSearchPattern = mysql.escape(`%${trimmedSearch}%`);
        const escapedSearchStart = mysql.escape(`${trimmedSearch}%`);
        
        // No exact category match - use relevance scoring for product name/SKU matches
        relevanceSelect = `,
          CASE 
            WHEN LOWER(p.name) LIKE ${escapedSearchStart} THEN 1
            WHEN LOWER(p.name) LIKE ${escapedSearchPattern} THEN 2
            WHEN LOWER(p.sku) LIKE ${escapedSearchPattern} THEN 3
            ELSE 4
          END as relevance_score`;
        
        // Order by relevance first, then by the specified sort field
        relevanceOrder = `ORDER BY relevance_score, p.${sortField} ${order}`;
      } catch (relevanceError) {
        // If relevance scoring fails, just use regular sorting
        console.error('Error setting up relevance scoring:', relevanceError);
        relevanceOrder = `ORDER BY p.${sortField} ${order}`;
      }
    } else {
      // Exact category match or no search - just order by sort field
      relevanceOrder = `ORDER BY p.${sortField} ${order}`;
    }

    const sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.short_description,
        p.price,
        p.original_price,
        p.sku,
        p.stock_quantity,
        p.is_featured,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.slug as category_slug,
        s.name as subcategory_name,
        s.slug as subcategory_slug,
        pi.image_url as primary_image
        ${relevanceSelect}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      ${whereClause}
      ${relevanceOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    // Log query details for debugging (especially for search)
    if (search) {
      console.log('=== SEARCH QUERY DEBUG ===');
      console.log('Search term:', search);
      console.log('Where clause:', whereClause);
      console.log('Query params:', params);
      console.log('Category match:', categoryMatch ? `${categoryMatch.name} (ID: ${categoryMatch.id})` : 'None');
    }
    
    console.log('Executing products query...');
    const products = await db.query(sql, params);
    console.log(`Found ${products.length} products`);
    
    if (search) {
      console.log(`Search results: ${products.length} products found for "${search}"`);
    }

    // Add empty colors array to each product (temporary fix)
    products.forEach(product => {
      product.colors = [];
    });

    // SIMPLIFIED COUNT QUERY
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      ${whereClause}
    `;
    const countParams = params.slice(0, -2); // Remove limit and offset
    
    console.log('Executing count query...');
    const countResult = await db.query(countSql, countParams);
    const [{ total }] = countResult;
    console.log(`Total products: ${total}`);

    console.log('Products API successful');
    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('=== PRODUCTS API ERROR ===');
    console.error('Error fetching products:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching products',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single product by SLUG (explicit to avoid route conflicts)
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const whereClause = 'p.slug = ?';
    
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause} AND p.is_active = 1
    `;

    const [product] = await db.query(sql, [slug]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get product images
    const images = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, is_primary DESC',
      [product.id]
    );

    // Get related products
    const relatedProducts = await db.query(`
      SELECT 
        p.*,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY RAND()
      LIMIT 4
    `, [product.category_id, product.id]);

    // Get product reviews
    const reviews = await db.query(`
      SELECT * FROM product_reviews 
      WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC
    `, [product.id]);

    res.json({
      ...product,
      images,
      relatedProducts,
      reviews
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Get single product by ID (numeric route)
router.get('/:id(\\d+)', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = 1
    `;
    const [product] = await db.query(sql, [id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const images = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, is_primary DESC',
      [product.id]
    );
    const relatedProducts = await db.query(`
      SELECT 
        p.*,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY RAND()
      LIMIT 4
    `, [product.category_id, product.id]);
    const reviews = await db.query(`
      SELECT * FROM product_reviews 
      WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC
    `, [product.id]);
    res.json({
      ...product,
      images,
      relatedProducts,
      reviews
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.homepage_section = 'featured' AND p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    const products = await db.query(sql, [parseInt(limit)]);
    
    // Get colors for each product
    for (let product of products) {
      const colors = await db.query(`
        SELECT * FROM product_colors 
        WHERE product_id = ? AND is_active = 1 
        ORDER BY sort_order, id
      `, [product.id]);
      product.colors = colors;
    }
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: 'Error fetching featured products' });
  }
});

// Get Victorian products
router.get('/victorian/list', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.homepage_section = 'victorian' AND p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    const products = await db.query(sql, [parseInt(limit)]);
    
    // Get colors for each product
    for (let product of products) {
      const colors = await db.query(`
        SELECT * FROM product_colors 
        WHERE product_id = ? AND is_active = 1 
        ORDER BY sort_order, id
      `, [product.id]);
      product.colors = colors;
    }
    
    res.json({ products });
  } catch (error) {
    console.error('Error fetching Victorian products:', error);
    res.status(500).json({ message: 'Error fetching Victorian products' });
  }
});

// Get Color Changing products
router.get('/color-changing/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.homepage_section = 'color-changing' AND p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    const products = await db.query(sql, [parseInt(limit)]);
    
    // Get colors for each product
    for (let product of products) {
      const colors = await db.query(`
        SELECT * FROM product_colors 
        WHERE product_id = ? AND is_active = 1 
        ORDER BY sort_order, id
      `, [product.id]);
      product.colors = colors;
    }
    
    res.json({ products });
  } catch (error) {
    console.error('Error fetching Color Changing products:', error);
    res.status(500).json({ message: 'Error fetching Color Changing products' });
  }
});

// Get products by category
router.get('/category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 12, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE c.slug = ? AND p.is_active = 1
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const products = await db.query(sql, [categorySlug, parseInt(limit), parseInt(offset)]);

    // Get category info
    const [category] = await db.query('SELECT * FROM categories WHERE slug = ?', [categorySlug]);

    res.json({
      category,
      products,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Error fetching products by category' });
  }
});

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const searchTerm = `%${query}%`;
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.is_active = 1 AND (
        p.name LIKE ? OR 
        p.description LIKE ? OR 
        p.short_description LIKE ? OR
        c.name LIKE ?
      )
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = await db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm, parseInt(limit), parseInt(offset)]);

    res.json({
      query,
      products,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Error searching products' });
  }
});

module.exports = router;
