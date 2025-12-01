const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all categories (public - only active)
router.get('/', async (req, res) => {
  try {
    const categories = await db.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get all categories (admin - includes inactive)
router.get('/admin', async (req, res) => {
  try {
    const categories = await db.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get single category by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [category] = await db.query(
      'SELECT * FROM categories WHERE slug = ? AND is_active = 1',
      [slug]
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get products in this category
    const products = await db.query(`
      SELECT 
        p.*,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.category_id = ? AND p.is_active = 1
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT 8
    `, [category.id]);

    res.json({
      ...category,
      products
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create category (admin)
router.post('/', async (req, res) => {
  try {
    const { name, description = '', sort_order = 0, is_active = true } = req.body;
    
    // Generate slug from name if not provided
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await db.query(
      'INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, slug, description, sort_order, is_active ? 1 : 0]
    );
    
    res.status(201).json({ 
      message: 'Category created successfully', 
      id: result.insertId || result[0]?.insertId || 'unknown'
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// Update category (admin)
router.put('/:id', async (req, res) => {
  try {
    const { name, description = '', sort_order = 0, is_active = true } = req.body;
    
    // Generate slug from name if not provided
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await db.query(
      'UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [name, slug, description, sort_order, is_active ? 1 : 0, req.params.id]
    );
    
    const affectedRows = result.affectedRows || result[0]?.affectedRows || 0;
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// Delete category (admin)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    
    const affectedRows = result.affectedRows || result[0]?.affectedRows || 0;
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;
