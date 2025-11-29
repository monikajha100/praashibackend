const express = require('express');
const router = express.Router();
const { UserAddress, User } = require('../models');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Helper function to get JWT secret
const getJWTSecret = async () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  return 'praashibysupal_jwt_secret_2025';
};

// Helper to get user from token
const getUserFromToken = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const jwtSecret = await getJWTSecret();
  const decoded = jwt.verify(token, jwtSecret);
  const user = await User.findByPk(decoded.userId);
  return user;
};

// Get all addresses for current user
router.get('/', async (req, res) => {
  try {
    console.log('=== GET USER ADDRESSES ===');
    
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const addresses = await UserAddress.findAll({
      where: { user_id: user.id },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });

    console.log(`Found ${addresses.length} addresses for user ${user.id}`);
    res.json(addresses);
  } catch (error) {
    console.error('=== GET ADDRESSES ERROR ===');
    console.error('Error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Error fetching addresses', error: error.message });
  }
});

// Get single address
router.get('/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const address = await UserAddress.findOne({
      where: {
        id: req.params.id,
        user_id: user.id
      }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ message: 'Error fetching address', error: error.message });
  }
});

// Create new address
router.post('/', [
  body('full_name').trim().isLength({ min: 2 }).withMessage('Full name is required'),
  body('address_line1').trim().isLength({ min: 5 }).withMessage('Address line 1 is required'),
  body('city').trim().isLength({ min: 2 }).withMessage('City is required'),
  body('state').trim().isLength({ min: 2 }).withMessage('State is required'),
  body('pincode').trim().isLength({ min: 5 }).withMessage('Pincode must be at least 5 characters'),
  body('phone').optional().custom((value) => {
    if (!value || value.trim() === '') return true; // Phone is optional
    const phone = value.trim();
    // Allow phone numbers with or without country code, just digits
    if (/^\d{10,15}$/.test(phone)) return true;
    throw new Error('Phone number must be 10-15 digits');
  }),
  body('address_type').optional().isIn(['home', 'work', 'other']).withMessage('Invalid address type')
], async (req, res) => {
  try {
    console.log('=== CREATE ADDRESS ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      landmark,
      address_type = 'home',
      is_default = false
    } = req.body;

    // If setting as default, unset other defaults
    if (is_default) {
      await UserAddress.update(
        { is_default: false },
        { where: { user_id: user.id } }
      );
    }

    const address = await UserAddress.create({
      user_id: user.id,
      full_name: full_name.trim(),
      phone: (phone && phone.trim()) || user.phone || null,
      address_line1: address_line1.trim(),
      address_line2: address_line2 ? address_line2.trim() : null,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark ? landmark.trim() : null,
      address_type,
      is_default
    });

    console.log(`✅ Address created: ${address.id}`);
    res.status(201).json({
      message: 'Address created successfully',
      address: address.toJSON()
    });
  } catch (error) {
    console.error('=== CREATE ADDRESS ERROR ===');
    console.error('Error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Error creating address', error: error.message });
  }
});

// Update address
router.put('/:id', [
  body('full_name').optional().trim().isLength({ min: 2 }),
  body('address_line1').optional().trim().isLength({ min: 5 }),
  body('city').optional().trim().isLength({ min: 2 }),
  body('state').optional().trim().isLength({ min: 2 }),
  body('pincode').optional().trim().isLength({ min: 5 }),
  body('phone').optional().custom((value) => {
    if (!value || value.trim() === '') return true; // Phone is optional
    const phone = value.trim();
    // Allow phone numbers with or without country code, just digits
    if (/^\d{10,15}$/.test(phone)) return true;
    throw new Error('Phone number must be 10-15 digits');
  }),
  body('address_type').optional().isIn(['home', 'work', 'other'])
], async (req, res) => {
  try {
    console.log('=== UPDATE ADDRESS ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const address = await UserAddress.findOne({
      where: {
        id: req.params.id,
        user_id: user.id
      }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      landmark,
      address_type,
      is_default
    } = req.body;

    // If setting as default, unset other defaults
    if (is_default && !address.is_default) {
      await UserAddress.update(
        { is_default: false },
        { where: { user_id: user.id, id: { [require('sequelize').Op.ne]: address.id } } }
      );
    }

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;
    if (address_line1) updateData.address_line1 = address_line1;
    if (address_line2 !== undefined) updateData.address_line2 = address_line2;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (pincode) updateData.pincode = pincode;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (address_type) updateData.address_type = address_type;
    if (is_default !== undefined) updateData.is_default = is_default;

    await address.update(updateData);

    console.log(`Address updated: ${address.id}`);
    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('=== UPDATE ADDRESS ERROR ===');
    console.error('Error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
});

// Delete address
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== DELETE ADDRESS ===');
    
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const address = await UserAddress.findOne({
      where: {
        id: req.params.id,
        user_id: user.id
      }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await address.destroy();

    console.log(`Address deleted: ${address.id}`);
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('=== DELETE ADDRESS ERROR ===');
    console.error('Error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
});

// Set default address
router.put('/:id/set-default', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const address = await UserAddress.findOne({
      where: {
        id: req.params.id,
        user_id: user.id
      }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Unset all other defaults
    await UserAddress.update(
      { is_default: false },
      { where: { user_id: user.id } }
    );

    // Set this as default
    await address.update({ is_default: true });

    res.json({
      message: 'Default address updated successfully',
      address
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ message: 'Error setting default address', error: error.message });
  }
});

module.exports = router;

