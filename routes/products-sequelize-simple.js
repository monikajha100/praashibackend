const express = require('express');
const router = express.Router();
const { Product, Category, Subcategory, ProductImage, ProductColor } = require('../models');
const { Op } = require('sequelize');

// Get all products with pagination and filters (ULTRA SIMPLIFIED VERSION)
router.get('/', async (req, res) => {
  try {
    console.log('=== ULTRA SIMPLIFIED PRODUCTS API REQUEST ===');
    
    const {
      page = 1,
      limit = 12,
      search,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      featured,
      category,
      subcategory,
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = {
      is_active: true
    };

    // Search filter - category-first matching (applies to ALL categories)
    // When searching for any category name (e.g., "earrings", "necklaces", "rings", etc.),
    // only show products from that specific category
    let categoryMatch = null;
    if (search) {
      const trimmedSearch = search.trim();
      const exactSearch = trimmedSearch.toLowerCase();
      
      try {
        // First, check if search term exactly matches ANY category name or slug (case-insensitive)
        // Try exact match first
        const db = require('../config/database');
        const categoryCheckResult = await db.query(
          'SELECT id, name, slug FROM categories WHERE LOWER(name) = ? OR LOWER(slug) = ? LIMIT 1',
          [exactSearch, exactSearch]
        );
        
        // Handle different result formats from database
        if (Array.isArray(categoryCheckResult)) {
          categoryMatch = categoryCheckResult.length > 0 ? categoryCheckResult[0] : null;
        } else if (categoryCheckResult && categoryCheckResult.id) {
          categoryMatch = categoryCheckResult;
        } else {
          categoryMatch = null;
        }
        
        // Convert to Sequelize model format if needed
        if (categoryMatch && categoryMatch.id && !categoryMatch.toJSON) {
          // It's a raw database result, convert to object
          categoryMatch = {
            id: categoryMatch.id,
            name: categoryMatch.name,
            slug: categoryMatch.slug
          };
        }
        
        if (categoryMatch) {
          // Exact category match found - ONLY show products from this specific category
          console.log(`✅ Category search match: "${trimmedSearch}" matched category "${categoryMatch.name}" (ID: ${categoryMatch.id}, slug: ${categoryMatch.slug})`);
          // Category filter will be applied via include below
        } else {
          // No exact category match - search in product names and SKU only (NOT description)
          whereConditions[Op.or] = [
            { name: { [Op.like]: `%${trimmedSearch}%` } },
            { sku: { [Op.like]: `%${trimmedSearch}%` } }
          ];
          console.log(`❌ No category match for "${trimmedSearch}", searching in product names and SKU only`);
        }
      } catch (categoryCheckError) {
        // If category check fails, fall back to regular product name/SKU search
        console.error('Error checking category match:', categoryCheckError);
        whereConditions[Op.or] = [
          { name: { [Op.like]: `%${trimmedSearch}%` } },
          { sku: { [Op.like]: `%${trimmedSearch}%` } }
        ];
        console.log(`Category check failed, falling back to product name/SKU search for "${trimmedSearch}"`);
      }
    }

    // Price filters
    if (minPrice) {
      whereConditions.price = { [Op.gte]: parseFloat(minPrice) };
    }
    if (maxPrice) {
      whereConditions.price = { ...whereConditions.price, [Op.lte]: parseFloat(maxPrice) };
    }

    // Featured filter
    if (featured === 'true') {
      whereConditions.is_featured = true;
    }

    // Sort validation
    const allowedSortFields = ['name', 'price', 'created_at', 'discount_percentage'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    console.log('Executing ultra simplified products query...');

    const include = [];

    // If search matched a category, filter by that category
    if (categoryMatch && categoryMatch.id) {
      include.push({
        model: Category,
        as: 'category',
        where: { id: categoryMatch.id }
      });
    }
    // Otherwise, use URL category parameter if provided
    else if (subcategory) {
      include.push({
        model: Subcategory,
        as: 'subcategory',
        where: { slug: subcategory }
      });
    }
    else if (category && !search) {
      include.push({
        model: Category,
        as: 'category',
        where: { slug: category }
      });
    }
    
    // Always include category and subcategory for product processing (if not already included)
    const hasCategory = include.some(inc => inc.as === 'category');
    const hasSubcategory = include.some(inc => inc.as === 'subcategory');
    
    if (!hasCategory) {
      include.push({
        model: Category,
        as: 'category',
        required: false
      });
    }
    if (!hasSubcategory) {
      include.push({
        model: Subcategory,
        as: 'subcategory',
        required: false
      });
    }
    
    // ULTRA SIMPLIFIED QUERY - Get products with category/subcategory data
    const products = await Product.findAll({
      where: whereConditions,
      include: include,
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`Found ${products.length} products`);

    // Get total count
    const totalProducts = await Product.count({
      where: whereConditions,
      include: include,
    });

    console.log(`Total products: ${totalProducts}`);

    // Process products with category and subcategory data
    const processedProducts = products.map(product => {
      const productData = product.toJSON();
      return {
        ...productData,
        primary_image: productData.primary_image || null,
        category_name: productData.category?.name || null,
        category_slug: productData.category?.slug || null,
        subcategory_name: productData.subcategory?.name || null,
        subcategory_slug: productData.subcategory?.slug || null,
        colors: []
      };
    });

    console.log('Ultra simplified products API successful');
    res.json({
      products: processedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts: totalProducts,
        hasNext: page < Math.ceil(totalProducts / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('=== ULTRA SIMPLIFIED PRODUCTS API ERROR ===');
    console.error('Error fetching products:', error);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Get single product by slug (SIMPLIFIED)
router.get('/slug/:slug', async (req, res) => {
  try {
    console.log('=== SIMPLIFIED SINGLE PRODUCT API REQUEST ===');
    const { slug } = req.params;
    console.log('Fetching product with slug:', slug);

    // First, get the product without includes to avoid association errors
    const product = await Product.findOne({
      where: { 
        slug: slug,
        is_active: true 
      }
    });

    if (!product) {
      console.log('Product not found for slug:', slug);
      return res.status(404).json({ message: 'Product not found' });
    }

    const productData = product.toJSON();
    console.log('Product found:', productData.id, productData.name);
    
    // Fetch category, subcategory, and images separately to avoid include errors
    let categoryData = null;
    let subcategoryData = null;
    let productImages = [];
    
    try {
      if (productData.category_id) {
        const cat = await Category.findByPk(productData.category_id);
        categoryData = cat ? (cat.toJSON ? cat.toJSON() : cat) : null;
      }
    } catch (catError) {
      console.error('Error fetching category:', catError);
      categoryData = null;
    }
    
    try {
      if (productData.subcategory_id) {
        const subcat = await Subcategory.findByPk(productData.subcategory_id);
        subcategoryData = subcat ? (subcat.toJSON ? subcat.toJSON() : subcat) : null;
      }
    } catch (subcatError) {
      console.error('Error fetching subcategory:', subcatError);
      subcategoryData = null;
    }
    
    try {
      const imagesResult = await ProductImage.findAll({
        where: { product_id: productData.id },
        order: [['sort_order', 'ASC'], ['is_primary', 'DESC']]
      });
      productImages = imagesResult.map(img => img.toJSON ? img.toJSON() : img);
    } catch (imgError) {
      console.error('Error fetching product images:', imgError);
      productImages = [];
    }
    
    // Get related products (same category, exclude current product)
    let relatedProducts = [];
    if (product.category_id) {
      try {
        relatedProducts = await Product.findAll({
          where: {
            category_id: product.category_id,
            id: { [Op.ne]: product.id },
            is_active: true
          },
          limit: 6,
          order: [['id', 'DESC']]
        });
        
        // Transform related products
        relatedProducts = relatedProducts.map(p => {
          const pData = p.toJSON();
          return {
            ...pData,
            primary_image: pData.primary_image || null
          };
        });
      } catch (relatedError) {
        console.error('Error fetching related products:', relatedError);
      }
    }
    
    // Build response with all data
    const response = {
      ...productData,
      primary_image: productData.primary_image || (productImages.length > 0 ? productImages[0].image_url : null),
      category_name: categoryData?.name || null,
      category_slug: categoryData?.slug || null,
      subcategory_name: subcategoryData?.name || null,
      subcategory_slug: subcategoryData?.slug || null,
      images: productImages.map(img => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: img.is_primary || false,
        sort_order: img.sort_order || 0
      })),
      productImages: productImages.map(img => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: img.is_primary || false,
        sort_order: img.sort_order || 0
      })),
      colors: [],
      relatedProducts: relatedProducts
    };

    console.log('Simplified single product API successful');
    console.log('Response keys:', Object.keys(response));
    res.json(response);

  } catch (error) {
    console.error('=== SIMPLIFIED SINGLE PRODUCT API ERROR ===');
    console.error('Error fetching product:', error);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Get single product by ID (SIMPLIFIED)
router.get('/:id', async (req, res) => {
  try {
    console.log('=== SIMPLIFIED PRODUCT BY ID API REQUEST ===');
    const { id } = req.params;

    const product = await Product.findOne({
      where: { 
        id: id,
        is_active: true 
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productData = product.toJSON();
    const response = {
      ...productData,
      primary_image: productData.primary_image || null,
      category_name: null,
      category_slug: null,
      subcategory_name: null,
      subcategory_slug: null,
      colors: []
    };

    console.log('Simplified product by ID API successful');
    res.json(response);

  } catch (error) {
    console.error('=== SIMPLIFIED PRODUCT BY ID API ERROR ===');
    console.error('Error fetching product:', error);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Get featured products (SIMPLIFIED)
router.get('/featured/list', async (req, res) => {
  try {
    console.log('=== SIMPLIFIED FEATURED PRODUCTS API REQUEST ===');
    const { limit = 8 } = req.query;

    const products = await Product.findAll({
      where: {
        is_active: true,
        is_featured: true
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    console.log(`Found ${products.length} featured products`);

    const processedProducts = products.map(product => {
      const productData = product.toJSON();
      return {
        ...productData,
        primary_image: productData.primary_image || null,
        category_name: null,
        category_slug: null,
        subcategory_name: null,
        subcategory_slug: null,
        colors: []
      };
    });

    console.log('Simplified featured products API successful');
    res.json({
      data: processedProducts,
      count: processedProducts.length
    });

  } catch (error) {
    console.error('=== SIMPLIFIED FEATURED PRODUCTS API ERROR ===');
    console.error('Error fetching featured products:', error);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      message: 'Error fetching featured products',
      error: error.message
    });
  }
});


// Get Color Changing products (SIMPLIFIED)
router.get('/category/:slug', async (req, res) => {
  try {
    console.log('=== SIMPLIFIED COLOR CHANGING PRODUCTS API REQUEST ===');
    const { limit = 10 } = req.query;

    const { slug } = req.params;
    const category = await Category.findOne({
      where: {
        slug: slug,
        is_active: true
      },
      include: [
        {
          model: Product,
          as: 'products',
          where: { is_active: true }
        }
      ]
    });

    

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const products = category.products;


    const processedProducts = products.map(product => {
      const productData = product.toJSON();
      return {
        ...productData,
        primary_image: productData.primary_image || null,
        category_name: null,
        category_slug: null,
        subcategory_name: null,
        subcategory_slug: null,
        colors: []
      };
    });

    console.log('Simplified Color Changing products API successful');
    res.json(processedProducts);

  } catch (error) {
    console.error('=== SIMPLIFIED COLOR CHANGING PRODUCTS API ERROR ===');
    console.error('Error fetching Color Changing products:', error);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      message: 'Error fetching Color Changing products',
      error: error.message
    });
  }
});

module.exports = router;
