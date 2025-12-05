const express = require('express');
const router = express.Router();
const { PromotionalBanner } = require('../models');
const { body, validationResult } = require('express-validator');

// Get all promotional banners (public - only active)
router.get('/', async (req, res) => {
  try {
    console.log('=== PROMOTIONAL BANNERS API REQUEST ===');
    
    const banners = await PromotionalBanner.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    console.log(`Found ${banners.length} promotional banners`);
    res.json(banners);
  } catch (error) {
    console.error('=== PROMOTIONAL BANNERS API ERROR ===');
    console.error('Error fetching promotional banners:', error);
    res.status(500).json({ 
      message: 'Error fetching promotional banners',
      error: error.message
    });
  }
});

// Get all promotional banners (admin - includes inactive)
router.get('/admin', async (req, res) => {
  try {
    console.log('=== ADMIN PROMOTIONAL BANNERS API REQUEST ===');
    
    const banners = await PromotionalBanner.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    console.log(`Found ${banners.length} promotional banners (admin)`);
    res.json(banners);
  } catch (error) {
    console.error('=== ADMIN PROMOTIONAL BANNERS API ERROR ===');
    console.error('Error fetching admin promotional banners:', error);
    res.status(500).json({ 
      message: 'Error fetching admin promotional banners',
      error: error.message
    });
  }
});

// Get single promotional banner by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await PromotionalBanner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: 'Promotional banner not found' });
    }

    console.log(`Found promotional banner: ${banner.text}`);
    res.json(banner);
  } catch (error) {
    console.error('Error fetching promotional banner by ID:', error);
    res.status(500).json({ message: 'Error fetching promotional banner' });
  }
});

// Create new promotional banner (admin only)
router.post('/', [
  body('text').trim().isLength({ min: 2 }).withMessage('Banner text is required'),
  body('background_color').optional().trim(),
  body('text_color').optional().trim(),
  body('sort_order').optional().isInt().withMessage('Sort order must be a number'),
  body('display_duration').optional().isInt().withMessage('Display duration must be a number'),
  // body('device_type').optional().isIn(['desktop', 'mobile', 'both']).withMessage('Device type must be desktop, mobile, or both'),
  body('mobile_text').optional().trim(),
  // body('mobile_background_color').optional().trim(),
  // body('mobile_text_color').optional().trim(),
  body('image_url').optional().trim(),
  // body('mobile_image_url').optional().trim(),
  body('link_url').optional().trim(),
  body('button_text').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      text, 
      background_color, 
      text_color, 
      sort_order, 
      display_duration,
      device_type,
      mobile_text,
      mobile_background_color,
      mobile_text_color,
      image_url,
      mobile_image_url,
      link_url,
      button_text
    } = req.body;

    const banner = await PromotionalBanner.create({
      text,
      background_color: background_color || '#000000',
      text_color: text_color || '#FFFFFF',
      sort_order: sort_order || 0,
      display_duration: display_duration || 5000,
      device_type: device_type || 'both',
      mobile_text: mobile_text || text,
      mobile_background_color: mobile_background_color || background_color || '#000000',
      mobile_text_color: mobile_text_color || text_color || '#FFFFFF',
      image_url: image_url || null,
      mobile_image_url: mobile_image_url || image_url || null,
      link_url: link_url || null,
      button_text: button_text || null,
      is_active: true
    });

    console.log(`Created new promotional banner: ${banner.text}`);
    res.status(201).json(banner);
  } catch (error) {
    console.error('Error creating promotional banner:', error);
    res.status(500).json({ message: 'Error creating promotional banner' });
  }
});

// Update promotional banner (admin only)
router.put('/:id', [
  body('text').optional().trim().isLength({ min: 2 }),
  body('background_color').optional().trim(),
  body('text_color').optional().trim(),
  body('sort_order').optional().isInt(),
  body('display_duration').optional().isInt(),
  body('is_active').optional().isBoolean(),
  body('device_type').optional().isIn(['desktop', 'mobile', 'both']),
  body('mobile_text').optional().trim(),
  body('mobile_background_color').optional().trim(),
  body('mobile_text_color').optional().trim(),
  body('image_url').optional().trim(),
  body('mobile_image_url').optional().trim(),
  body('link_url').optional().trim(),
  body('button_text').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if banner exists
    const banner = await PromotionalBanner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: 'Promotional banner not found' });
    }

    await banner.update(updateData);
    
    console.log(`Updated promotional banner: ${banner.text}`);
    res.json(banner);
  } catch (error) {
    console.error('Error updating promotional banner:', error);
    res.status(500).json({ message: 'Error updating promotional banner' });
  }
});

// Delete promotional banner (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await PromotionalBanner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: 'Promotional banner not found' });
    }

    await banner.destroy();
    
    console.log(`Deleted promotional banner: ${banner.text}`);
    res.json({ message: 'Promotional banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotional banner:', error);
    res.status(500).json({ message: 'Error deleting promotional banner' });
  }
});

// Toggle promotional banner active status (admin only)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await PromotionalBanner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: 'Promotional banner not found' });
    }

    await banner.update({ is_active: !banner.is_active });
    
    console.log(`Toggled promotional banner status: ${banner.text} - ${banner.is_active ? 'Active' : 'Inactive'}`);
    res.json(banner);
  } catch (error) {
    console.error('Error toggling promotional banner status:', error);
    res.status(500).json({ message: 'Error toggling promotional banner status' });
  }
});

module.exports = router;
