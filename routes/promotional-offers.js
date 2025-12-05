const express = require('express');
const router = express.Router();
const { PromotionalOffer } = require('../models');
const { Op } = require('sequelize');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Development bypass middleware
const devBypassAdmin = (req, res, next) => {
  if (process.env.DEV_ALLOW_NONADMIN === 'true') {
    return next();
  }
  return requireAdmin(req, res, next);
};

// Get all active promotional offers (Public)
router.get('/', async (req, res) => {
  try {
    const offers = await PromotionalOffer.getActiveOffers();
    res.json(offers);
  } catch (error) {
    console.error('Error fetching promotional offers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching promotional offers',
      error: error.message 
    });
  }
});

// Get single promotional offer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await PromotionalOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Promotional offer not found' 
      });
    }
    
    res.json(offer);
  } catch (error) {
    console.error('Error fetching promotional offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching promotional offer',
      error: error.message 
    });
  }
});

// Get all promotional offers with filters (Admin)
router.get('/admin/all', authenticateToken, devBypassAdmin, async (req, res) => {
  try {
    const { is_active, offer_type } = req.query;
    
    const whereClause = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    if (offer_type) {
      whereClause.offer_type = offer_type;
    }
    
    const offers = await PromotionalOffer.findAll({
      where: whereClause,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    
    res.json(offers);
  } catch (error) {
    console.error('Error fetching all promotional offers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching promotional offers',
      error: error.message 
    });
  }
});

// Create new promotional offer (Admin)
router.post('/', authenticateToken, devBypassAdmin, async (req, res) => {
  try {
    const offerData = {
      title: req.body.title,
      description: req.body.description || null,
      offer_type: req.body.offer_type,
      discount_value: req.body.discount_value ? parseFloat(req.body.discount_value) : 0.00,
      discount_type: req.body.discount_type || 'percentage',
      minimum_amount: req.body.minimum_amount ? parseFloat(req.body.minimum_amount) : 0.00,
      maximum_discount: req.body.maximum_discount ? parseFloat(req.body.maximum_discount) : null,
      buy_quantity: req.body.buy_quantity ? parseInt(req.body.buy_quantity) : 1,
      get_quantity: req.body.get_quantity ? parseInt(req.body.get_quantity) : 1,
      icon: req.body.icon || '?',
      background_color: req.body.background_color || '#FF6B6B',
      text_color: req.body.text_color || '#FFFFFF',
      button_color: req.body.button_color || '#FFB6C1',
      is_active: req.body.is_active === true || req.body.is_active === 'true',
      sort_order: req.body.sort_order ? parseInt(req.body.sort_order) : 0,
      starts_at: req.body.starts_at || null,
      expires_at: req.body.expires_at || null
    };
    
    const offer = await PromotionalOffer.create(offerData);
    
    res.status(201).json({
      success: true,
      message: 'Promotional offer created successfully',
      offer
    });
  } catch (error) {
    console.error('Error creating promotional offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating promotional offer',
      error: error.message 
    });
  }
});

// Update promotional offer (Admin)
router.put('/:id', authenticateToken, devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await PromotionalOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Promotional offer not found' 
      });
    }
    
    // Update fields
    const updateFields = [
      'title', 'description', 'offer_type', 'discount_value', 'discount_type',
      'minimum_amount', 'maximum_discount', 'buy_quantity', 'get_quantity',
      'icon', 'background_color', 'text_color', 'button_color',
      'is_active', 'sort_order', 'starts_at', 'expires_at'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'is_active') {
          offer[field] = req.body[field] === true || req.body[field] === 'true';
        } else if (field === 'discount_value' || field === 'minimum_amount' || field === 'maximum_discount') {
          offer[field] = req.body[field] ? parseFloat(req.body[field]) : null;
        } else if (field === 'buy_quantity' || field === 'get_quantity' || field === 'sort_order') {
          offer[field] = req.body[field] ? parseInt(req.body[field]) : null;
        } else {
          offer[field] = req.body[field];
        }
      }
    });
    
    await offer.save();
    
    res.json({
      success: true,
      message: 'Promotional offer updated successfully',
      offer
    });
  } catch (error) {
    console.error('Error updating promotional offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating promotional offer',
      error: error.message 
    });
  }
});

// Delete promotional offer (Admin)
router.delete('/:id', authenticateToken, devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await PromotionalOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Promotional offer not found' 
      });
    }
    
    await offer.destroy();
    
    res.json({
      success: true,
      message: 'Promotional offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotional offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting promotional offer',
      error: error.message 
    });
  }
});

module.exports = router;















