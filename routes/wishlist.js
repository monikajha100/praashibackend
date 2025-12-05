const express = require('express');
const router = express.Router();
const { Wishlist, Product, ProductImage } = require('../models');
const jwt = require('jsonwebtoken');
const { devBypass } = require('../middleware/auth');

// Helper function to get JWT secret
const getJWTSecret = async () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  return 'praashibysupal_jwt_secret_2025';
};

// Helper to get user from token or dev bypass
const getUserFromToken = async (req) => {
  try {
    // Check for dev bypass user (set by devBypass middleware)
    if (req.user && req.user.userId) {
      const { User } = require('../models');
      try {
        let user = await User.findByPk(req.user.userId);
        if (user) {
          console.log('Using dev bypass user:', user.id, user.email);
          return user;
        } else {
          console.log('Dev bypass user not found in database, userId:', req.user.userId);
          // Try to find any user as fallback for dev
          if (process.env.NODE_ENV !== 'production') {
            user = await User.findOne({ order: [['id', 'ASC']] });
            if (user) {
              console.log('Using first available user for dev:', user.id, user.email);
              return user;
            } else {
              console.error('No users found in database for dev bypass');
              return null;
            }
          }
        }
      } catch (dbError) {
        console.error('Database error looking up dev bypass user:', dbError);
        console.error('Database error details:', dbError.message);
        return null;
      }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const jwtSecret = await getJWTSecret();
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return null;
    }
    
    const { User } = require('../models');
    const user = await User.findByPk(decoded.userId);
    return user;
  } catch (error) {
    console.error('Error in getUserFromToken:', error);
    return null;
  }
};

// Get all wishlist items for current user
router.get('/', devBypass, async (req, res) => {
  try {
    console.log('=== WISHLIST GET REQUEST ===');
    console.log('Request headers:', req.headers.authorization ? 'Has auth header' : 'No auth header');
    
    const user = await getUserFromToken(req);
    if (!user) {
      console.log('No user found - returning 401');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('User found:', user.id, user.email);

    // Try to fetch wishlist items with associations
    let wishlistItems;
    try {
      wishlistItems = await Wishlist.findAll({
        where: { user_id: user.id },
        include: [
          {
            model: Product,
            as: 'product',
            required: false,
            include: [
              {
                model: ProductImage,
                as: 'productImages',
                required: false,
                limit: 1
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });
    } catch (includeError) {
      console.error('Error fetching wishlist with includes:', includeError);
      // Fallback: fetch without includes
      wishlistItems = await Wishlist.findAll({
        where: { user_id: user.id },
        order: [['created_at', 'DESC']]
      });
    }

    console.log('Found wishlist items:', wishlistItems.length);

    // Format the response
    const formattedItems = wishlistItems.map(item => {
      const itemData = item.toJSON ? item.toJSON() : item;
      const product = itemData.product || {};
      
      // Handle both direct product data and nested product structure
      const productId = product.id || itemData.product_id;
      const productName = product.name;
      const productSlug = product.slug;
      const productPrice = product.price;
      const productOriginalPrice = product.original_price;
      
      // Handle product images - check both nested structure and direct access
      let productImage = null;
      if (product.productImages && product.productImages.length > 0) {
        productImage = product.productImages[0].image_url || product.productImages[0].image;
      } else if (product.image) {
        productImage = product.image;
      } else if (itemData.product_image) {
        productImage = itemData.product_image;
      }
      
      return {
        id: itemData.id,
        product_id: productId,
        product_name: productName,
        product_slug: productSlug,
        product_price: productPrice,
        product_original_price: productOriginalPrice,
        product_image: productImage,
        added_at: itemData.created_at || item.created_at
      };
    });

    res.json(formattedItems);
  } catch (error) {
    console.error('=== WISHLIST GET ERROR ===');
    console.error('Error fetching wishlist:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    
    // Return safe error response
    const errorMessage = error?.message || 'Error fetching wishlist';
    res.status(500).json({ 
      success: false,
      message: 'Error fetching wishlist', 
      error: errorMessage.substring(0, 200) 
    });
  }
});

// Add product to wishlist
router.post('/', devBypass, async (req, res) => {
  try {
    console.log('=== WISHLIST ADD REQUEST ===');
    console.log('Request body:', req.body);
    
    const user = await getUserFromToken(req);
    if (!user) {
      console.log('No user found - authentication required');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('User authenticated:', user.id, user.email);

    const { product_id } = req.body;

    if (!product_id) {
      console.log('No product_id provided');
      return res.status(400).json({ message: 'Product ID is required' });
    }

    console.log('Checking product with ID:', product_id);

    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      console.log('Product not found:', product_id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product found:', product.id, product.name);

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({
      where: {
        user_id: user.id,
        product_id: product_id
      }
    });

    if (existingItem) {
      console.log('Product already in wishlist');
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    console.log('Creating wishlist item...');
    // Add to wishlist
    // Ensure product_id is an integer
    const productIdInt = parseInt(product_id);
    if (isNaN(productIdInt)) {
      console.log('Invalid product_id format:', product_id);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID format' 
      });
    }
    
    console.log('Creating wishlist entry with user_id:', user.id, 'product_id:', productIdInt);
    
    let wishlistItem;
    try {
      wishlistItem = await Wishlist.create({
        user_id: user.id,
        product_id: productIdInt
      });
      console.log('Wishlist item created successfully:', wishlistItem.id);
    } catch (createError) {
      console.error('Error during Wishlist.create:', createError);
      console.error('Create error name:', createError?.name);
      console.error('Create error message:', createError?.message);
      
      // Re-throw to be caught by outer catch block
      throw createError;
    }

    // Convert wishlist item to plain object to avoid serialization issues
    const wishlistItemData = wishlistItem.toJSON ? wishlistItem.toJSON() : {
      id: wishlistItem.id,
      user_id: wishlistItem.user_id,
      product_id: wishlistItem.product_id,
      created_at: wishlistItem.created_at,
      updated_at: wishlistItem.updated_at
    };
    
    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      item: wishlistItemData
    });
  } catch (error) {
    console.error('=== WISHLIST ADD ERROR ===');
    console.error('Error adding to wishlist:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Ensure we have a valid error message
    const errorName = error?.name || 'UnknownError';
    const errorMessage = error?.message || 'An unknown error occurred';
    
    if (errorName === 'JsonWebTokenError' || errorName === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    
    // Handle unique constraint violation (duplicate entry)
    if (errorName === 'SequelizeUniqueConstraintError' || 
        errorMessage.includes('Duplicate entry') ||
        errorMessage.includes('UNIQUE constraint') ||
        errorMessage.includes('already exists')) {
      console.log('Duplicate entry detected - product already in wishlist');
      return res.status(400).json({ 
        success: false,
        message: 'Product already in wishlist' 
      });
    }
    
    // Handle validation errors
    if (errorName === 'SequelizeValidationError') {
      const validationErrors = error.errors?.map(e => e.message).join(', ') || errorMessage;
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        error: validationErrors 
      });
    }
    
    // Handle database connection errors
    if (errorName === 'SequelizeConnectionError' || errorName === 'SequelizeDatabaseError') {
      console.error('Database error:', errorMessage);
      return res.status(500).json({ 
        success: false,
        message: 'Database error. Please try again later.' 
      });
    }
    
    // Return safe error response (avoid sending non-serializable data)
    // Ensure error message is a string and safe to serialize
    let safeErrorMessage = 'Error adding to wishlist. Please try again.';
    
    if (typeof errorMessage === 'string' && errorMessage.length > 0) {
      // Remove any non-printable characters and limit length
      safeErrorMessage = errorMessage
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .substring(0, 200); // Limit length
    }
    
    // Ensure response is properly formatted JSON
    try {
      res.status(500).json({ 
        success: false,
        message: 'Error adding to wishlist', 
        error: safeErrorMessage
      });
    } catch (jsonError) {
      // If JSON serialization fails, send plain text
      console.error('Failed to send JSON error response:', jsonError);
      res.status(500).send('Error adding to wishlist');
    }
  }
});

// Remove product from wishlist
router.delete('/:productId', devBypass, async (req, res) => {
  try {
    console.log('=== WISHLIST DELETE REQUEST ===');
    console.log('Product ID:', req.params.productId);
    
    const user = await getUserFromToken(req);
    if (!user) {
      console.log('No user found - authentication required');
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    console.log('User authenticated:', user.id, user.email);

    const { productId } = req.params;
    const productIdInt = parseInt(productId);
    
    if (isNaN(productIdInt)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID format' 
      });
    }

    const wishlistItem = await Wishlist.findOne({
      where: {
        user_id: user.id,
        product_id: productIdInt
      }
    });

    if (!wishlistItem) {
      console.log('Wishlist item not found');
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in wishlist' 
      });
    }

    await wishlistItem.destroy();
    console.log('Wishlist item deleted successfully');

    res.json({ 
      success: true,
      message: 'Product removed from wishlist' 
    });
  } catch (error) {
    console.error('=== WISHLIST DELETE ERROR ===');
    console.error('Error removing from wishlist:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    
    const errorMessage = error?.message || 'Error removing from wishlist';
    res.status(500).json({ 
      success: false,
      message: 'Error removing from wishlist', 
      error: errorMessage.substring(0, 200) 
    });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', devBypass, async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.json({ inWishlist: false });
    }

    const { productId } = req.params;
    const productIdInt = parseInt(productId);
    
    if (isNaN(productIdInt)) {
      return res.json({ inWishlist: false });
    }

    const wishlistItem = await Wishlist.findOne({
      where: {
        user_id: user.id,
        product_id: productIdInt
      }
    });

    res.json({ inWishlist: !!wishlistItem });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    // Always return false on error to prevent UI issues
    res.json({ inWishlist: false });
  }
});

module.exports = router;
