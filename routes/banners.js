const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all banners
router.get('/', async (req, res) => {
  try {
    const banners = await db.query(
      'SELECT id, title, subtitle, image, mobile_title, mobile_subtitle, mobile_image, device_type, link_url, button_text, sort_order, is_active, created_at, updated_at FROM banners ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(banners);
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ message: 'Error fetching banners', error: error.message });
  }
});

// Get all banners (admin endpoint)
router.get('/admin', async (req, res) => {
  try {
    const banners = await db.query(
      'SELECT id, title, subtitle, image, mobile_title, mobile_subtitle, mobile_image, device_type, link_url, button_text, sort_order, is_active, created_at, updated_at FROM banners ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(banners);
  } catch (error) {
    console.error('Get admin banners error:', error);
    res.status(500).json({ message: 'Error fetching banners', error: error.message });
  }
});

// Get active banners only
router.get('/active', async (req, res) => {
  try {
    const banners = await db.query(
      'SELECT id, title, subtitle, image, mobile_title, mobile_subtitle, mobile_image, device_type, link_url, button_text, sort_order, is_active, created_at, updated_at FROM banners WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    res.json(banners);
  } catch (error) {
    console.error('Get active banners error:', error);
    res.status(500).json({ message: 'Error fetching active banners', error: error.message });
  }
});

// Get single banner by ID
router.get('/:id', async (req, res) => {
  try {
    const banners = await db.query(
      'SELECT id, title, subtitle, image, mobile_title, mobile_subtitle, mobile_image, device_type, link_url, button_text, sort_order, is_active, created_at, updated_at FROM banners WHERE id = ?', 
      [req.params.id]
    );
    if (banners.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json(banners[0]);
  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({ message: 'Error fetching banner', error: error.message });
  }
});

// Create banner (handles both /api/banners and /api/admin/banners)
router.post('/', async (req, res) => {
  try {
    const { title, subtitle, image, mobile_title, mobile_subtitle, mobile_image, device_type, link_url, button_text, sort_order, is_active } = req.body;
    
    const result = await db.query(
      'INSERT INTO banners (title, subtitle, image, mobile_title, mobile_subtitle, mobile_image, device_type, link_url, button_text, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, subtitle, image, mobile_title || title, mobile_subtitle || subtitle, mobile_image || image, device_type || 'both', link_url, button_text, sort_order || 0, is_active ? 1 : 0]
    );
    
    res.status(201).json({ 
      message: 'Banner created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ message: 'Error creating banner', error: error.message });
  }
});

// Update banner (handles both /api/banners/:id and /api/admin/banners/:id)
router.put('/:id', async (req, res) => {
  try {
    const { title, subtitle, image, mobile_title, mobile_subtitle, mobile_image, device_type, link_url, button_text, sort_order, is_active } = req.body;
    
    const result = await db.query(
      'UPDATE banners SET title = ?, subtitle = ?, image = ?, mobile_title = ?, mobile_subtitle = ?, mobile_image = ?, device_type = ?, link_url = ?, button_text = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [title, subtitle, image, mobile_title, mobile_subtitle, mobile_image, device_type, link_url, button_text, sort_order, is_active ? 1 : 0, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json({ message: 'Banner updated successfully' });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ message: 'Error updating banner', error: error.message });
  }
});

// Delete banner (handles both /api/banners/:id and /api/admin/banners/:id)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ message: 'Error deleting banner', error: error.message });
  }
});

// Toggle banner active status (admin only)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current status
    const [banners] = await db.query('SELECT is_active FROM banners WHERE id = ?', [id]);
    if (banners.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    // Toggle status
    const newStatus = !banners[0].is_active;
    const result = await db.query('UPDATE banners SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus ? 1 : 0, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json({ message: 'Banner status updated successfully', is_active: newStatus });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({ message: 'Error updating banner status', error: error.message });
  }
});

module.exports = router;
