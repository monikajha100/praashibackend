const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all subcategories (public - only active)
router.get('/', async (req, res) => {
  try {
    const { category_id } = req.query;
    
    let query = `
      SELECT 
        s.*,
        c.name as category_name,
        c.slug as category_slug
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = 1
    `;
    
    const params = [];
    if (category_id) {
      query += ' AND s.category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY s.sort_order ASC, s.name ASC';
    
    const subcategories = await db.query(query, params);
    res.json(subcategories);
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
  }
});

// Get all subcategories (admin - includes inactive)
router.get('/admin', async (req, res) => {
  try {
    const { category_id } = req.query;
    
    let query = `
      SELECT 
        s.*,
        c.name as category_name,
        c.slug as category_slug
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
    `;
    
    const params = [];
    if (category_id) {
      query += ' WHERE s.category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY s.sort_order ASC, s.name ASC';
    
    const subcategories = await db.query(query, params);
    res.json(subcategories);
  } catch (error) {
    console.error('Get admin subcategories error:', error);
    res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
  }
});

// Get subcategories by category slug
router.get('/category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;
    
    const subcategories = await db.query(`
      SELECT 
        s.*,
        c.name as category_name,
        c.slug as category_slug
      FROM subcategories s
      INNER JOIN categories c ON s.category_id = c.id
      WHERE c.slug = ? AND s.is_active = 1
      ORDER BY s.sort_order ASC, s.name ASC
    `, [categorySlug]);
    
    res.json(subcategories);
  } catch (error) {
    console.error('Get subcategories by category error:', error);
    res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
  }
});

// Get single subcategory
router.get('/:id', async (req, res) => {
  try {
    const subcategories = await db.query(`
      SELECT 
        s.*,
        c.name as category_name,
        c.slug as category_slug
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (!subcategories || subcategories.length === 0) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    
    res.json(subcategories[0]);
  } catch (error) {
    console.error('Get subcategory error:', error);
    res.status(500).json({ message: 'Error fetching subcategory', error: error.message });
  }
});

// Create subcategory (admin)
router.post('/', async (req, res) => {
  try {
    const { category_id, name, description = '', sort_order = 0, is_active = true } = req.body;
    
    // Generate slug from name if not provided
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await db.query(
      'INSERT INTO subcategories (category_id, name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name, slug, description, sort_order, is_active ? 1 : 0]
    );
    
    res.status(201).json({ 
      message: 'Subcategory created successfully', 
      id: result.insertId || result[0]?.insertId || 'unknown'
    });
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({ message: 'Error creating subcategory', error: error.message });
  }
});

// Update subcategory (admin)
router.put('/:id', async (req, res) => {
  try {
    const { category_id, name, description = '', sort_order = 0, is_active = true } = req.body;
    
    // Generate slug from name if not provided
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await db.query(
      'UPDATE subcategories SET category_id = ?, name = ?, slug = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [category_id, name, slug, description, sort_order, is_active ? 1 : 0, req.params.id]
    );
    
    const affectedRows = result.affectedRows || result[0]?.affectedRows || 0;
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    
    res.json({ message: 'Subcategory updated successfully' });
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({ message: 'Error updating subcategory', error: error.message });
  }
});

// Delete subcategory (admin)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM subcategories WHERE id = ?', [req.params.id]);
    
    const affectedRows = result.affectedRows || result[0]?.affectedRows || 0;
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ message: 'Error deleting subcategory', error: error.message });
  }
});

module.exports = router;
