const express = require('express');
const router = express.Router();
const { Subcategory, Category, Product } = require('../models');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');

// Get all subcategories (public - only active)
router.get('/', async (req, res) => {
  try {
    console.log('=== SEQUELIZE SUBCATEGORIES API REQUEST ===');
    
    const subcategories = await Subcategory.findAll({
      where: { is_active: true },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        // {
        //   model: Product,
        //   as: 'products',
        //   where: { is_active: true },
        //   required: false,
        //   attributes: ['id']
        // }
      ],
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      // attributes: {
      //   include: [
      //     [Subcategory.sequelize.fn('COUNT', Subcategory.sequelize.col('products.id')), 'product_count']
      //   ]
      // },
      group: ['Subcategory.id'],
      raw: false
    });

    // Transform the data to include product count
    const transformedSubcategories = subcategories.map(subcategory => {
      const subcategoryData = subcategory.toJSON();
      return {
        ...subcategoryData,
        product_count: 0 //subcategoryData.products ? subcategoryData.products.length : 0
      };
    });

    console.log(`Found ${transformedSubcategories.length} subcategories`);
    res.json(transformedSubcategories);
  } catch (error) {
    console.error('=== SEQUELIZE SUBCATEGORIES API ERROR ===');
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ 
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
});

// Get subcategories by category
router.get('/category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;
    
    const subcategories = await Subcategory.findAll({
      where: { is_active: true },
      include: [
        {
          model: Category,
          as: 'category',
          where: { slug: categorySlug },
          attributes: ['id', 'name', 'slug']
        },
        // {
        //   model: Product,
        //   as: 'products',
        //   where: { is_active: true },
        //   required: false,
        //   attributes: ['id']
        // }
      ],
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      // attributes: {
      //   include: [
      //     [Subcategory.sequelize.fn('COUNT', Subcategory.sequelize.col('products.id')), 'product_count']
      //   ]
      // },
      group: ['Subcategory.id'],
      raw: false
    });

    // Transform the data
    const transformedSubcategories = subcategories.map(subcategory => {
      const subcategoryData = subcategory.toJSON();
      return {
        ...subcategoryData,
        product_count: 0 // subcategoryData.products ? subcategoryData.products.length : 0
      };
    });

    console.log(`Found ${transformedSubcategories.length} subcategories for category: ${categorySlug}`);
    res.json(transformedSubcategories);
  } catch (error) {
    console.error('Error fetching subcategories by category:', error);
    res.status(500).json({ message: 'Error fetching subcategories' });
  }
});

// Get single subcategory by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const subcategory = await Subcategory.findOne({
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
          model: Product,
          as: 'products',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'name', 'slug', 'price', 'primary_image']
        }
      ]
    });

    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    const subcategoryData = subcategory.toJSON();
    console.log(`Found subcategory: ${subcategoryData.name} with ${subcategoryData.products.length} products`);
    res.json(subcategoryData);
  } catch (error) {
    console.error('Error fetching subcategory by slug:', error);
    res.status(500).json({ message: 'Error fetching subcategory' });
  }
});

// Get all subcategories (admin - includes inactive)
router.get('/admin/all', async (req, res) => {
  try {
    console.log('=== SEQUELIZE ADMIN SUBCATEGORIES API REQUEST ===');
    
    const subcategories = await Subcategory.findAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        // {
        //   model: Product,
        //   as: 'products',
        //   required: false,
        //   attributes: ['id']
        // }
      ],
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      // attributes: {
      //   include: [
      //     [Subcategory.sequelize.fn('COUNT', Subcategory.sequelize.col('products.id')), 'product_count']
      //   ]
      // },
      group: ['Subcategory.id'],
      raw: false
    });

    // Transform the data
    const transformedSubcategories = subcategories.map(subcategory => {
      const subcategoryData = subcategory.toJSON();
      return {
        ...subcategoryData,
        product_count: 0 // subcategoryData.products ? subcategoryData.products.length : 0
      };
    });

    console.log(`Found ${transformedSubcategories.length} subcategories (admin)`);
    res.json(transformedSubcategories);
  } catch (error) {
    console.error('=== SEQUELIZE ADMIN SUBCATEGORIES API ERROR ===');
    console.error('Error fetching admin subcategories:', error);
    res.status(500).json({ 
      message: 'Error fetching admin subcategories',
      error: error.message
    });
  }
});

// Create new subcategory (admin only)
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Subcategory name is required'),
  body('slug').trim().isLength({ min: 2 }).withMessage('Subcategory slug is required'),
  body('category_id').isInt().withMessage('Category ID is required'),
  body('description').optional().trim(),
  body('image').optional().trim(),
  body('sort_order').optional().isInt().withMessage('Sort order must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, slug, category_id, description, image, sort_order } = req.body;

    // Check if category exists
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Check if slug already exists
    const existingSubcategory = await Subcategory.findOne({ where: { slug } });
    if (existingSubcategory) {
      return res.status(400).json({ message: 'Subcategory slug already exists' });
    }

    const subcategory = await Subcategory.create({
      name,
      slug,
      category_id,
      description,
      image,
      sort_order: sort_order || 0,
      is_active: true
    });

    console.log(`Created new subcategory: ${subcategory.name}`);
    res.status(201).json(subcategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ message: 'Error creating subcategory' });
  }
});

// Update subcategory (admin only)
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('slug').optional().trim().isLength({ min: 2 }),
  body('category_id').optional().isInt(),
  body('description').optional().trim(),
  body('image').optional().trim(),
  body('sort_order').optional().isInt(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if subcategory exists
    const subcategory = await Subcategory.findByPk(id);
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    // Check if category exists (if being updated)
    if (updateData.category_id) {
      const category = await Category.findByPk(updateData.category_id);
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    // Check if slug already exists (if being updated)
    if (updateData.slug && updateData.slug !== subcategory.slug) {
      const existingSubcategory = await Subcategory.findOne({ 
        where: { 
          slug: updateData.slug,
          id: { [Op.ne]: id }
        } 
      });
      if (existingSubcategory) {
        return res.status(400).json({ message: 'Subcategory slug already exists' });
      }
    }

    await subcategory.update(updateData);
    
    console.log(`Updated subcategory: ${subcategory.name}`);
    res.json(subcategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ message: 'Error updating subcategory' });
  }
});

// Delete subcategory (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await Subcategory.findByPk(id);
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    // Check if subcategory has products
    const productCount = await Product.count({ where: { subcategory_id: id } });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete subcategory with existing products',
        product_count: productCount
      });
    }

    await subcategory.destroy();
    
    console.log(`Deleted subcategory: ${subcategory.name}`);
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ message: 'Error deleting subcategory' });
  }
});

module.exports = router;
