const express = require('express');
const router = express.Router();
const { Product, Category, Subcategory, ProductImage, ProductColor } = require('../models');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');

// Get all products with pagination and filters (SEQUELIZE VERSION)
router.get('/', async (req, res) => {
  try {
    console.log('=== SEQUELIZE PRODUCTS API REQUEST ===');
    
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

    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = {
      is_active: true
    };

    // Category filter
    if (category) {
      whereConditions['$category.slug$'] = category;
    }

    // Subcategory filter
    if (subcategory) {
      whereConditions['$subcategory.slug$'] = subcategory;
    }

    // Search filter
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { short_description: { [Op.like]: `%${search}%` } }
      ];
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

    console.log('Executing Sequelize products query...');
    
    // Get products with associations
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Subcategory,
          as: 'subcategory',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductImage,
          as: 'productImages',
          where: { is_primary: true },
          required: false,
          attributes: ['image_url']
        }
      ],
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    console.log(`Found ${products.length} products out of ${count} total`);

    // Get colors for each product (with limit to prevent performance issues)
    const maxProducts = 50;
    const productsToProcess = products.slice(0, maxProducts);
    
    for (let i = 0; i < productsToProcess.length; i++) {
      const product = productsToProcess[i];
      try {
        const colors = await ProductColor.findAll({
          where: {
            product_id: product.id,
            is_active: true
          },
          order: [['sort_order', 'ASC'], ['id', 'ASC']],
          attributes: ['id', 'color_name', 'color_code', 'color_image', 'is_primary', 'sort_order']
        });
        
        product.dataValues.colors = colors;
      } catch (colorError) {
        console.error(`Error fetching colors for product ${product.id}:`, colorError.message);
        product.dataValues.colors = [];
      }
    }
    
    // Set empty colors for any products beyond the limit
    for (let i = maxProducts; i < products.length; i++) {
      products[i].dataValues.colors = [];
    }

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => {
      const productData = product.toJSON();
      return {
        ...productData,
        primary_image: productData.productImages && productData.productImages.length > 0 
          ? productData.productImages[0].image_url 
          : null,
        category_name: productData.category?.name || null,
        category_slug: productData.category?.slug || null,
        subcategory_name: productData.subcategory?.name || null,
        subcategory_slug: productData.subcategory?.slug || null,
        colors: productData.colors || []
      };
    });

    console.log('Sequelize Products API successful');
    res.json({
      products: transformedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalProducts: count,
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('=== SEQUELIZE PRODUCTS API ERROR ===');
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

// Get single product by SLUG (SEQUELIZE VERSION)
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const product = await Product.findOne({
      where: { 
        slug: slug,
        is_active: true 
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Subcategory,
          as: 'subcategory',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductImage,
          as: 'productImages',
          order: [['sort_order', 'ASC'], ['id', 'ASC']],
          attributes: ['id', 'image_url', 'is_primary', 'sort_order']
        },
        {
          model: ProductColor,
          as: 'colors',
          where: { is_active: true },
          required: false,
          order: [['sort_order', 'ASC'], ['id', 'ASC']],
          attributes: ['id', 'color_name', 'color_code', 'color_image', 'is_primary', 'sort_order']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productData = product.toJSON();
    
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
          include: [
            {
              model: ProductImage,
              as: 'productImages',
              where: { is_primary: true },
              required: false,
              attributes: ['image_url']
            }
          ],
          limit: 6,
          order: [['id', 'DESC']] // Use DESC order as fallback instead of RAND() for better performance
        });
        
        // Transform related products
        relatedProducts = relatedProducts.map(p => {
          const pData = p.toJSON();
          return {
            ...pData,
            primary_image: pData.productImages && pData.productImages.length > 0 
              ? pData.productImages[0].image_url 
              : pData.primary_image || null
          };
        });
      } catch (relatedError) {
        console.error('Error fetching related products:', relatedError);
      }
    }
    
    // Transform the data
    const transformedProduct = {
      ...productData,
      primary_image: productData.images && productData.images.length > 0 
        ? productData.productImages.find(img => img.is_primary)?.image_url || productData.productImages[0].image_url
        : null,
      category_name: productData.category?.name || null,
      category_slug: productData.category?.slug || null,
      subcategory_name: productData.subcategory?.name || null,
      subcategory_slug: productData.subcategory?.slug || null,
      relatedProducts: relatedProducts
    };

    res.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Get single product by ID (SEQUELIZE VERSION)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({
      where: { 
        id: id,
        is_active: true 
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Subcategory,
          as: 'subcategory',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductImage,
          as: 'productImages',
          order: [['sort_order', 'ASC'], ['id', 'ASC']],
          attributes: ['id', 'image_url', 'is_primary', 'sort_order']
        },
        {
          model: ProductColor,
          as: 'colors',
          where: { is_active: true },
          required: false,
          order: [['sort_order', 'ASC'], ['id', 'ASC']],
          attributes: ['id', 'color_name', 'color_code', 'color_image', 'is_primary', 'sort_order']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productData = product.toJSON();
    
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
          include: [
            {
              model: ProductImage,
              as: 'productImages',
              where: { is_primary: true },
              required: false,
              attributes: ['image_url']
            }
          ],
          limit: 6,
          order: [['id', 'DESC']] // Use DESC order as fallback instead of RAND() for better performance
        });
        
        // Transform related products
        relatedProducts = relatedProducts.map(p => {
          const pData = p.toJSON();
          return {
            ...pData,
            primary_image: pData.productImages && pData.productImages.length > 0 
              ? pData.productImages[0].image_url 
              : pData.primary_image || null
          };
        });
      } catch (relatedError) {
        console.error('Error fetching related products:', relatedError);
      }
    }
    
    // Transform the data
    const transformedProduct = {
      ...productData,
      primary_image: productData.images && productData.images.length > 0 
        ? productData.productImages.find(img => img.is_primary)?.image_url || productData.productImages[0].image_url
        : null,
      category_name: productData.category?.name || null,
      category_slug: productData.category?.slug || null,
      subcategory_name: productData.subcategory?.name || null,
      subcategory_slug: productData.subcategory?.slug || null,
      relatedProducts: relatedProducts
    };

    res.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

module.exports = router;
