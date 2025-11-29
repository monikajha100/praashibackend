const express = require('express');
const router = express.Router();
const { Category, Product } = require('../models');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');

// Get all categories (public - only active) - SIMPLIFIED VERSION
router.get('/', async (req, res) => {
  try {
    console.log('=== SIMPLIFIED CATEGORIES API REQUEST ===');
    
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'slug', 'description', 'image', 'is_active', 'sort_order', 'created_at', 'updated_at']
    });
    
    console.log(`Found ${categories.length} categories`);
    
    // Add product count using a separate query to avoid complex joins
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.count({
          where: { 
            category_id: category.id,
            is_active: true 
          }
        });
        
        return {
          ...category.toJSON(),
          product_count: productCount
        };
      })
    );
    
    console.log('Simplified Categories API successful');
    res.json(categoriesWithCount);
    
  } catch (error) {
    console.error('=== SIMPLIFIED CATEGORIES API ERROR ===');
    console.error('Error fetching categories:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error fetching categories',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all categories (admin - includes inactive) - SIMPLIFIED VERSION
router.get('/admin', async (req, res) => {
  try {
    console.log('=== SIMPLIFIED ADMIN CATEGORIES API REQUEST ===');
    
    const categories = await Category.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'slug', 'description', 'image', 'is_active', 'sort_order', 'created_at', 'updated_at']
    });
    
    console.log(`Found ${categories.length} categories (admin)`);
    
    // Add product count using a separate query
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.count({
          where: { category_id: category.id }
        });
        
        return {
          ...category.toJSON(),
          product_count: productCount
        };
      })
    );
    
    console.log('Simplified Admin Categories API successful');
    res.json(categoriesWithCount);
    
  } catch (error) {
    console.error('=== SIMPLIFIED ADMIN CATEGORIES API ERROR ===');
    console.error('Error fetching admin categories:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error fetching admin categories',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      attributes: ['id', 'name', 'slug', 'description', 'image', 'is_active', 'sort_order', 'created_at', 'updated_at']
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Get product count
    const productCount = await Product.count({
      where: { 
        category_id: category.id,
        is_active: true 
      }
    });
    
    res.json({
      ...category.toJSON(),
      product_count: productCount
    });
    
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// Create new category (admin only)
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('slug').trim().isLength({ min: 2 }).withMessage('Slug must be at least 2 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, slug, description, image, sort_order = 0 } = req.body;
    
    const category = await Category.create({
      name,
      slug,
      description,
      image,
      is_active: true,
      sort_order
    });
    
    res.status(201).json({ message: 'Category created successfully', category });
    
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      message: 'Error creating category',
      error: error.message
    });
  }
});

// Update category (admin only)
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('slug').optional().trim().isLength({ min: 2 }).withMessage('Slug must be at least 2 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedRows] = await Category.update(updateData, {
      where: { id: id }
    });
    
    if (updatedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const updatedCategory = await Category.findByPk(id);
    res.json({ message: 'Category updated successfully', category: updatedCategory });
    
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      message: 'Error updating category',
      error: error.message
    });
  }
});

// Delete category (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const productCount = await Product.count({
      where: { category_id: id }
    });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products',
        product_count: productCount
      });
    }
    
    const deletedRows = await Category.destroy({
      where: { id: id }
    });
    
    if (deletedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      message: 'Error deleting category',
      error: error.message
    });
  }
});

module.exports = router;
