const express = require('express');
const router = express.Router();
const { Category, Product } = require('../models');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');

// Get all categories (public - only active)
router.get('/', async (req, res) => {
  try {
    console.log('=== SEQUELIZE CATEGORIES API REQUEST ===');
    
    const categories = await Category.findAll({
      where: { is_active: true },
      include: [
        {
          model: Product,
          as: 'products',
          where: { is_active: true },
          required: false,
          attributes: ['id']
        }
      ],
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: {
        include: [
          [Category.sequelize.fn('COUNT', Category.sequelize.col('products.id')), 'product_count']
        ]
      },
      group: ['Category.id'],
      raw: false
    });

    // Transform the data to include product count
    const transformedCategories = categories.map(category => {
      const categoryData = category.toJSON();
      return {
        ...categoryData,
        product_count: categoryData.products ? categoryData.products.length : 0
      };
    });

    console.log(`Found ${transformedCategories.length} categories`);
    res.json(transformedCategories);
  } catch (error) {
    console.error('=== SEQUELIZE CATEGORIES API ERROR ===');
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Get all categories (admin - includes inactive)
router.get('/admin', async (req, res) => {
  try {
    console.log('=== SEQUELIZE ADMIN CATEGORIES API REQUEST ===');
    
    const categories = await Category.findAll({
      include: [
        {
          model: Product,
          as: 'products',
          required: false,
          attributes: ['id']
        }
      ],
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: {
        include: [
          [Category.sequelize.fn('COUNT', Category.sequelize.col('products.id')), 'product_count']
        ]
      },
      group: ['Category.id'],
      raw: false
    });

    // Transform the data to include product count
    const transformedCategories = categories.map(category => {
      const categoryData = category.toJSON();
      return {
        ...categoryData,
        product_count: categoryData.products ? categoryData.products.length : 0
      };
    });

    console.log(`Found ${transformedCategories.length} categories (admin)`);
    res.json(transformedCategories);
  } catch (error) {
    console.error('=== SEQUELIZE ADMIN CATEGORIES API ERROR ===');
    console.error('Error fetching admin categories:', error);
    res.status(500).json({ 
      message: 'Error fetching admin categories',
      error: error.message
    });
  }
});

// Get single category by slug
router.get('/:slug', async (req, res) => {
  try {
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
          where: { is_active: true },
          required: false,
          attributes: ['id', 'name', 'slug', 'price', 'primary_image']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const categoryData = category.toJSON();
    console.log(`Found category: ${categoryData.name} with ${categoryData.products.length} products`);
    res.json(categoryData);
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create new category (admin only)
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Category name is required'),
  body('slug').trim().isLength({ min: 2 }).withMessage('Category slug is required'),
  body('description').optional().trim(),
  body('image').optional().trim(),
  body('sort_order').optional().isInt().withMessage('Sort order must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, slug, description, image, sort_order } = req.body;

    // Check if slug already exists
    const existingCategory = await Category.findOne({ where: { slug } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category slug already exists' });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      sort_order: sort_order || 0,
      is_active: true
    });

    console.log(`Created new category: ${category.name}`);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Update category (admin only)
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('slug').optional().trim().isLength({ min: 2 }),
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

    // Check if category exists
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if slug already exists (if being updated)
    if (updateData.slug && updateData.slug !== category.slug) {
      const existingCategory = await Category.findOne({ 
        where: { 
          slug: updateData.slug,
          id: { [Op.ne]: id }
        } 
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category slug already exists' });
      }
    }

    await category.update(updateData);
    
    console.log(`Updated category: ${category.name}`);
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete category (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has products
    const productCount = await Product.count({ where: { category_id: id } });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products',
        product_count: productCount
      });
    }

    await category.destroy();
    
    console.log(`Deleted category: ${category.name}`);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

module.exports = router;
