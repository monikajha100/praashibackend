const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const SpecialOffer = require('../models/SpecialOffer');
const OfferCalculator = require('../services/OfferCalculator');
const { requireAdmin } = require('../middleware/auth');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Special offers route is working',
    timestamp: new Date().toISOString()
  });
});

// Development bypass middleware
const devBypass = (req, res, next) => {
  if (process.env.DEV_ALLOW_NONADMIN === 'true') {
    req.user = { userId: 1, email: 'dev@test.com', role: 'admin' };
  }
  next();
};

const devBypassAdmin = (req, res, next) => {
  if (process.env.DEV_ALLOW_NONADMIN === 'true') {
    return next();
  }
  return requireAdmin(req, res, next);
};

const RAW_TO_CLIENT_OFFER_TYPE = {
  percentage: 'percentage',
  fixed_amount: 'fixed_amount',
  buy_x_get_y: 'buy_x_get_y',
  minimum_purchase: 'minimum_purchase',
  referral: 'referral',
  flash_sale: 'percentage',
  discount_percentage: 'percentage',
  new_arrival: 'percentage',
  discount_fixed: 'fixed_amount',
  free_shipping: 'free_shipping'
};

const LEGACY_TO_STORAGE = {
  flash_sale: 'percentage',
  discount_percentage: 'percentage',
  new_arrival: 'percentage',
  discount_fixed: 'fixed_amount',
  free_shipping: 'free_shipping'
};

const VALID_STORAGE_TYPES = new Set([
  'percentage',
  'fixed_amount',
  'buy_x_get_y',
  'minimum_purchase',
  'referral',
  'flash_sale',
  'new_arrival',
  'discount_percentage',
  'discount_fixed',
  'free_shipping'
]);

const normalizeOfferTypeForClient = (rawType) => {
  const key = (rawType || '').toString().trim().toLowerCase();
  return RAW_TO_CLIENT_OFFER_TYPE[key] || 'percentage';
};

const convertOfferTypeForStorage = (inputType, fallbackType = 'percentage') => {
  const key = (inputType || '').toString().trim().toLowerCase();
  if (VALID_STORAGE_TYPES.has(key)) {
    return LEGACY_TO_STORAGE[key] || key;
  }

  if (LEGACY_TO_STORAGE[key]) {
    return LEGACY_TO_STORAGE[key];
  }

  if (RAW_TO_CLIENT_OFFER_TYPE[key]) {
    return LEGACY_TO_STORAGE[key] || key;
  }

  return fallbackType;
};

const serializeOffer = (offerInstance) => {
  if (!offerInstance) return null;

  const raw = offerInstance.toJSON ? offerInstance.toJSON() : { ...offerInstance };
  const clientType = normalizeOfferTypeForClient(raw.offer_type);

  return {
    ...raw,
    offer_type: clientType,
    original_offer_type: raw.offer_type
  };
};

// Get all active special offers (Public)
router.get('/', async (req, res) => {
  try {
    const { show_all } = req.query;
    
    // Check if table exists and model is properly initialized
    try {
      await SpecialOffer.describe();
    } catch (tableError) {
      console.error('Special offers table error:', tableError);
      // If table doesn't exist, return empty array
      return res.json([]);
    }
    
    let offers = [];
    
    try {
      if (show_all === 'true') {
        // Get all active offers (for checkout) - show all active offers regardless of date restrictions
        // Don't filter by discount_percentage here, let frontend handle which ones can be applied
        offers = await SpecialOffer.findAll({
          where: {
            is_active: true
          },
          order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
          raw: false // Return full model instances
        });
        console.log(`=== CHECKOUT OFFERS DEBUG ===`);
        console.log(`Found ${offers.length} active offers for checkout`);
        if (offers.length > 0) {
          console.log('Offer IDs:', offers.map(o => o.id));
          console.log('Offer titles:', offers.map(o => o.title));
        }
        
        // Convert to plain objects if needed
        if (offers.length > 0 && offers[0].toJSON) {
          offers = offers.map(o => o.toJSON());
        }
      } else {
        // Get only currently active offers (for homepage) - respects date restrictions
        const now = new Date();
        const allActiveOffers = await SpecialOffer.findAll({
          where: {
            is_active: true
          },
          order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
          raw: false
        });
        
        // Filter by date restrictions manually
        offers = allActiveOffers.filter(offer => {
          try {
            const offerData = offer.toJSON ? offer.toJSON() : offer;
            if (!offerData.is_active) return false;
            
            // Check start date
            if (offerData.start_date) {
              const startDate = new Date(offerData.start_date);
              if (startDate > now) {
                return false;
              }
            }
            
            // Check end date
            if (offerData.end_date) {
              const endDate = new Date(offerData.end_date);
              if (endDate < now) {
                return false;
              }
            }
            
            return true;
          } catch (filterError) {
            console.error('Error filtering offer:', filterError);
            return false;
          }
        });
        
        // Convert to plain objects
        if (offers.length > 0 && offers[0].toJSON) {
          offers = offers.map(o => o.toJSON());
        }
      }
    } catch (queryError) {
      console.error('Error querying special offers:', queryError);
      console.error('Query error details:', queryError.message);
      // Return empty array on query error
      offers = [];
    }
    
    // Ensure we're returning an array
    if (!Array.isArray(offers)) {
      console.error('WARNING: Offers is not an array!', typeof offers, offers);
      offers = [];
    }
    
    res.json(offers.map(serializeOffer));
  } catch (error) {
    console.error('Error fetching special offers:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return empty array instead of error to prevent frontend crashes
    res.json([]);
  }
});

// Get all special offers with filters (Admin)
router.get('/admin/all', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { is_active, sort_by = 'sort_order' } = req.query;
    
    const whereClause = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    
    const offers = await SpecialOffer.findAll({
      where: whereClause,
      order: [[sort_by, 'ASC'], ['created_at', 'DESC']]
    });
    
    res.json(offers.map(serializeOffer));
  } catch (error) {
    console.error('Error fetching all special offers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching special offers',
      error: error.message 
    });
  }
});

// Get single special offer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await SpecialOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Special offer not found' 
      });
    }
    
    res.json(serializeOffer(offer));
  } catch (error) {
    console.error('Error fetching special offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching special offer',
      error: error.message 
    });
  }
});

// Create new special offer (Admin)
router.post('/', devBypass, devBypassAdmin, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('link_url').trim().notEmpty().withMessage('Link URL is required'),
  body('button_text').trim().notEmpty().withMessage('Button text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    
    const offerData = {
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon || '🎁',
      offer_type: convertOfferTypeForStorage(req.body.offer_type),
      discount_percentage: req.body.discount_percentage ? parseInt(req.body.discount_percentage) : null,
      discount_amount: req.body.discount_amount ? parseFloat(req.body.discount_amount) : null,
      discount_text: req.body.discount_text || null,
      highlight_text: req.body.highlight_text || null,
      badge_text: req.body.badge_text || null,
      timer_enabled: req.body.timer_enabled === true || req.body.timer_enabled === 'true',
      timer_text: req.body.timer_text || null,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
      link_url: req.body.link_url,
      button_text: req.body.button_text,
      background_color: req.body.background_color || null,
      text_color: req.body.text_color || null,
      sort_order: req.body.sort_order ? parseInt(req.body.sort_order) : 0,
      is_active: req.body.is_active === true || req.body.is_active === 'true',
      minimum_purchase_amount: req.body.minimum_purchase_amount ? parseFloat(req.body.minimum_purchase_amount) : null,
      buy_quantity: req.body.buy_quantity ? parseInt(req.body.buy_quantity) : null,
      get_quantity: req.body.get_quantity ? parseInt(req.body.get_quantity) : null,
      product_ids: req.body.product_ids || null,
      category_ids: req.body.category_ids || null,
      referral_code: req.body.referral_code || null,
      max_discount_amount: req.body.max_discount_amount ? parseFloat(req.body.max_discount_amount) : null,
      priority: req.body.priority !== undefined && req.body.priority !== null && req.body.priority !== '' 
        ? (parseInt(req.body.priority) || 0) 
        : 0,
      stackable: req.body.stackable === true || req.body.stackable === 'true'
    };
    
    const offer = await SpecialOffer.create(offerData);
    
    res.status(201).json({
      success: true,
      message: 'Special offer created successfully',
      offer: serializeOffer(offer)
    });
  } catch (error) {
    console.error('Error creating special offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating special offer',
      error: error.message 
    });
  }
});

// Update special offer (Admin)
router.put('/:id', devBypass, devBypassAdmin, [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('link_url').optional().trim().notEmpty().withMessage('Link URL is required'),
  body('button_text').optional().trim().notEmpty().withMessage('Button text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    console.log(`Updating offer ID: ${id}`);
    console.log('Request body:', req.body);
    
    const offer = await SpecialOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Special offer not found' 
      });
    }
    
    // If existing offer has invalid offer_type, fix it first
    if (offer.offer_type && !VALID_STORAGE_TYPES.has(offer.offer_type)) {
      console.warn(`Invalid offer_type detected: ${offer.offer_type}, fixing to 'percentage'`);
      offer.offer_type = 'percentage';
      await offer.save();
    }
    
    // Prepare update data object
    const updateData = {};
    
    // Update fields - handle all fields properly
    if (req.body.title !== undefined) {
      updateData.title = typeof req.body.title === 'string' ? req.body.title.trim() : req.body.title;
    }
    if (req.body.description !== undefined) {
      updateData.description = typeof req.body.description === 'string' ? req.body.description.trim() : req.body.description;
    }
    if (req.body.icon !== undefined) {
      updateData.icon = req.body.icon || '🎁';
    }
    if (req.body.offer_type !== undefined) {
      updateData.offer_type = convertOfferTypeForStorage(req.body.offer_type, offer.offer_type || 'percentage');
    }
    if (req.body.link_url !== undefined) {
      updateData.link_url = typeof req.body.link_url === 'string' ? req.body.link_url.trim() : req.body.link_url;
    }
    if (req.body.button_text !== undefined) {
      updateData.button_text = typeof req.body.button_text === 'string' ? req.body.button_text.trim() : req.body.button_text;
    }
    
    // Handle boolean fields
    if (req.body.timer_enabled !== undefined) {
      updateData.timer_enabled = req.body.timer_enabled === true || req.body.timer_enabled === 'true';
    }
    if (req.body.is_active !== undefined) {
      updateData.is_active = req.body.is_active === true || req.body.is_active === 'true';
    }
    if (req.body.stackable !== undefined) {
      updateData.stackable = req.body.stackable === true || req.body.stackable === 'true';
    }
    
    // Handle numeric fields
    if (req.body.discount_percentage !== undefined) {
      if (req.body.discount_percentage === '' || req.body.discount_percentage === null) {
        updateData.discount_percentage = null;
      } else {
        const parsed = parseInt(req.body.discount_percentage);
        updateData.discount_percentage = isNaN(parsed) ? null : parsed;
      }
    }
    
    if (req.body.sort_order !== undefined) {
      const parsed = parseInt(req.body.sort_order);
      updateData.sort_order = isNaN(parsed) ? 0 : parsed;
    }
    
    if (req.body.buy_quantity !== undefined) {
      if (req.body.buy_quantity === '' || req.body.buy_quantity === null) {
        updateData.buy_quantity = null;
      } else {
        const parsed = parseInt(req.body.buy_quantity);
        updateData.buy_quantity = isNaN(parsed) ? null : parsed;
      }
    }
    
    if (req.body.get_quantity !== undefined) {
      if (req.body.get_quantity === '' || req.body.get_quantity === null) {
        updateData.get_quantity = null;
      } else {
        const parsed = parseInt(req.body.get_quantity);
        updateData.get_quantity = isNaN(parsed) ? null : parsed;
      }
    }
    
    // Priority is required and cannot be null
    if (req.body.priority !== undefined) {
      const parsed = parseInt(req.body.priority);
      updateData.priority = isNaN(parsed) ? 0 : parsed;
    } else {
      // Ensure priority always has a value (default to 0 if not provided)
      updateData.priority = offer.priority !== null && offer.priority !== undefined ? offer.priority : 0;
    }
    
    // Handle decimal fields
    if (req.body.discount_amount !== undefined) {
      if (req.body.discount_amount === '' || req.body.discount_amount === null) {
        updateData.discount_amount = null;
      } else {
        const parsed = parseFloat(req.body.discount_amount);
        updateData.discount_amount = isNaN(parsed) ? null : parsed;
      }
    }
    
    if (req.body.minimum_purchase_amount !== undefined) {
      if (req.body.minimum_purchase_amount === '' || req.body.minimum_purchase_amount === null) {
        updateData.minimum_purchase_amount = null;
      } else {
        const parsed = parseFloat(req.body.minimum_purchase_amount);
        updateData.minimum_purchase_amount = isNaN(parsed) ? null : parsed;
      }
    }
    
    if (req.body.max_discount_amount !== undefined) {
      if (req.body.max_discount_amount === '' || req.body.max_discount_amount === null) {
        updateData.max_discount_amount = null;
      } else {
        const parsed = parseFloat(req.body.max_discount_amount);
        updateData.max_discount_amount = isNaN(parsed) ? null : parsed;
      }
    }
    
    // Handle text fields (can be empty strings, convert to null)
    if (req.body.discount_text !== undefined) {
      updateData.discount_text = (typeof req.body.discount_text === 'string' && req.body.discount_text.trim()) || null;
    }
    if (req.body.highlight_text !== undefined) {
      updateData.highlight_text = (typeof req.body.highlight_text === 'string' && req.body.highlight_text.trim()) || null;
    }
    if (req.body.badge_text !== undefined) {
      updateData.badge_text = (typeof req.body.badge_text === 'string' && req.body.badge_text.trim()) || null;
    }
    if (req.body.timer_text !== undefined) {
      updateData.timer_text = (typeof req.body.timer_text === 'string' && req.body.timer_text.trim()) || null;
    }
    if (req.body.background_color !== undefined) {
      updateData.background_color = (typeof req.body.background_color === 'string' && req.body.background_color.trim()) || null;
    }
    if (req.body.text_color !== undefined) {
      updateData.text_color = (typeof req.body.text_color === 'string' && req.body.text_color.trim()) || null;
    }
    if (req.body.referral_code !== undefined) {
      updateData.referral_code = (typeof req.body.referral_code === 'string' && req.body.referral_code.trim()) || null;
    }
    if (req.body.product_ids !== undefined) {
      updateData.product_ids = req.body.product_ids || null;
    }
    if (req.body.category_ids !== undefined) {
      updateData.category_ids = req.body.category_ids || null;
    }
    
    // Handle date fields
    if (req.body.start_date !== undefined) {
      updateData.start_date = req.body.start_date || null;
    }
    if (req.body.end_date !== undefined) {
      updateData.end_date = req.body.end_date || null;
    }
    
    console.log('Update data:', updateData);
    
    // Validate that we have at least some data to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    // Update the offer
    try {
      await offer.update(updateData);
      
      // Reload to get updated data
      await offer.reload();
      
      console.log('Offer updated successfully');
      
      res.json({
        success: true,
        message: 'Special offer updated successfully',
        offer: serializeOffer(offer)
      });
    } catch (updateError) {
      console.error('Database update error:', updateError);
      console.error('Update error name:', updateError.name);
      console.error('Update error message:', updateError.message);
      
      // Check for specific database errors
      if (updateError.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: updateError.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }
      
      if (updateError.name === 'SequelizeDatabaseError') {
        return res.status(400).json({
          success: false,
          message: 'Database error',
          error: updateError.message
        });
      }
      
      throw updateError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error updating special offer:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return more detailed error information
    res.status(500).json({ 
      success: false,
      message: 'Error updating special offer',
      error: error.message,
      errorType: error.name
    });
  }
});

// Delete special offer (Admin)
router.delete('/:id', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await SpecialOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Special offer not found' 
      });
    }
    
    await offer.destroy();
    
    res.json({
      success: true,
      message: 'Special offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting special offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting special offer',
      error: error.message 
    });
  }
});

// Toggle offer active status (Admin)
router.patch('/:id/toggle', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await SpecialOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Special offer not found' 
      });
    }
    
    offer.is_active = !offer.is_active;
    await offer.save();
    
    res.json({
      success: true,
      message: `Special offer ${offer.is_active ? 'activated' : 'deactivated'} successfully`,
      offer: serializeOffer(offer)
    });
  } catch (error) {
    console.error('Error toggling special offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error toggling special offer',
      error: error.message 
    });
  }
});

// Track offer view
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await SpecialOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Special offer not found' 
      });
    }
    
    offer.views_count += 1;
    await offer.save();
    
    res.json({
      success: true,
      message: 'View tracked'
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error tracking view',
      error: error.message 
    });
  }
});

// Track offer click
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await SpecialOffer.findByPk(id);
    
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Special offer not found' 
      });
    }
    
    offer.clicks_count += 1;
    await offer.save();
    
    res.json({
      success: true,
      message: 'Click tracked'
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error tracking click',
      error: error.message 
    });
  }
});

// Get offer analytics (Admin)
router.get('/admin/analytics', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const offers = await SpecialOffer.findAll({
      attributes: [
        'id', 'title', 'is_active', 'views_count', 'clicks_count',
        'created_at', 'start_date', 'end_date'
      ],
      order: [['clicks_count', 'DESC']]
    });
    
    const analytics = offers.map(offer => {
      const serialized = serializeOffer(offer);
      const viewsCount = parseInt(serialized.views_count || 0, 10);
      const clicksCount = parseInt(serialized.clicks_count || 0, 10);

      return {
        ...serialized,
        ctr: viewsCount > 0
          ? ((clicksCount / viewsCount) * 100).toFixed(2)
          : 0
      };
    });
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching analytics',
      error: error.message 
    });
  }
});

// Get customers who availed a specific offer (Admin)
router.get('/admin/:id/customers', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { Order } = require('../models');
    
    const orders = await Order.findAll({
      where: {
        offer_id: parseInt(id)
      },
      attributes: [
        'id',
        'order_number',
        'customer_name',
        'customer_email',
        'customer_phone',
        'total_amount',
        'payment_status',
        'status',
        'created_at'
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      customers: orders.map(order => ({
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        totalAmount: parseFloat(order.total_amount),
        paymentStatus: order.payment_status,
        orderStatus: order.status,
        orderDate: order.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching offer customers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching offer customers',
      error: error.message 
    });
  }
});

// Calculate offer discount (Public - for checkout)
router.post('/calculate', async (req, res) => {
  try {
    const { offer_id, cart_items } = req.body;

    if (!offer_id || !cart_items || !Array.isArray(cart_items)) {
      return res.status(400).json({
        success: false,
        message: 'offer_id and cart_items array are required'
      });
    }

    const offer = await SpecialOffer.findByPk(offer_id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Check if offer is applicable
    if (!OfferCalculator.isOfferApplicable(offer, cart_items)) {
      return res.status(400).json({
        success: false,
        message: 'Offer is not applicable to this cart',
        discount: 0
      });
    }

    // Calculate discount
    const result = OfferCalculator.calculateDiscount(offer, cart_items);

    // If discount is 0 and there's an error message, return it as an error response
    if (result.discount === 0 && result.message && 
        (result.message.includes('not configured') || result.message.includes('Unknown offer type'))) {
      return res.status(400).json({
        success: false,
        discount: 0,
        message: result.message,
        eligible_items_count: result.eligibleItems.length
      });
    }

    res.json({
      success: true,
      discount: result.discount,
      message: result.message,
      eligible_items_count: result.eligibleItems.length,
      discounted_items: result.discountedItems || [], // Include item-level discount info
      offer: serializeOffer(offer)
    });
  } catch (error) {
    console.error('Error calculating offer discount:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating offer discount',
      error: error.message
    });
  }
});

module.exports = router;