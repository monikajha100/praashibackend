const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, CompanySetting, UserAddress } = require('../models');
const { Op } = require('sequelize');

// Helper function to get JWT secret
const getJWTSecret = async () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  
  try {
    const setting = await CompanySetting.findOne({
      where: { setting_key: 'jwt_secret' }
    });
    
    if (setting) {
      return setting.setting_value;
    }
    
    // Fallback secret
    return 'praashibysupal_jwt_secret_2025';
  } catch (error) {
    console.error('Error getting JWT secret:', error);
    return 'praashibysupal_jwt_secret_2025';
  }
};

// Register user
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    console.log('=== SEQUELIZE USER REGISTRATION ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'user',
      is_active: true
    });

    // Generate JWT token
    const jwtSecret = await getJWTSecret();
    const token = jwt.sign(
      { userId: user.id, email, role: 'user' },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log(`User registered successfully: ${user.email}`);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('=== SEQUELIZE REGISTRATION ERROR ===');
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Error during registration' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('=== SEQUELIZE USER LOGIN ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Normalize email - the validator already normalizes it, but ensure lowercase
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    console.log(`🔐 Login attempt - Email: ${normalizedEmail}, Password length: ${password ? password.length : 0}`);
    
    // Find user - try both exact match and case-insensitive
    let user = await User.findOne({ 
      where: { 
        email: normalizedEmail 
      } 
    });
    
    // If not found with exact match, try case-insensitive search
    if (!user) {
      const { Op } = require('sequelize');
      user = await User.findOne({ 
        where: { 
          email: {
            [Op.like]: normalizedEmail
          }
        } 
      });
    }
    
    if (!user) {
      console.log(`❌ Login failed: User not found with email: ${normalizedEmail}`);
      
      // Try to find similar emails for debugging
      const { Op } = require('sequelize');
      const similarUsers = await User.findAll({
        where: {
          email: {
            [Op.like]: `%${normalizedEmail.split('@')[0]}%`
          }
        },
        attributes: ['id', 'email'],
        limit: 5
      });
      
      if (similarUsers.length > 0) {
        console.log(`   Found similar emails: ${similarUsers.map(u => u.email).join(', ')}`);
      }
      
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log(`❌ Login failed: Account deactivated for: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Normalize password input (remove spaces, special chars that might be in phone number)
    const normalizedPassword = password.toString().trim().replace(/[\s\-\(\)]/g, '');
    
    // Build password variants to try
    const passwordVariants = [
      password.toString().trim(),           // Original trimmed
      normalizedPassword,                   // Fully normalized (no spaces/dashes)
      password.toString().replace(/\s/g, ''), // No spaces only
    ];
    
    // If user has a phone number, also try normalized versions of it (in case password is phone)
    if (user.phone) {
      const phoneNormalized = user.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
      passwordVariants.push(
        user.phone.toString().trim(),
        phoneNormalized,
        user.phone.toString().replace(/\s/g, '')
      );
    }

    // Verify password - try all variants
    let isPasswordValid = false;
    for (const passwordVariant of passwordVariants) {
      try {
        isPasswordValid = await bcrypt.compare(passwordVariant, user.password);
        if (isPasswordValid) {
          console.log(`✅ Password matched with variant: ${passwordVariant.substring(0, 3)}***`);
          break;
        }
      } catch (error) {
        console.error(`Error comparing password variant:`, error);
      }
    }

    if (!isPasswordValid) {
      console.log(`❌ Login failed: Invalid password for: ${normalizedEmail}`);
      console.log(`   Password variants tried: ${passwordVariants.length}`);
      console.log(`   User phone: ${user.phone || 'N/A'}`);
      
      // Provide helpful hint in response
      let hint = '';
      if (user.phone) {
        const phoneNormalized = user.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
        hint = ` Hint: Try using your phone number (${phoneNormalized.substring(0, 3)}***) as password.`;
      }
      
      return res.status(401).json({ 
        message: 'Invalid email or password.' + hint,
        hint: user.phone ? `Password should be your phone number (digits only)` : undefined
      });
    }

    // Ensure role is set correctly (default to 'user' if not set)
    const userRole = user.role || 'user';
    console.log(`User role from database: ${userRole} (type: ${typeof userRole})`);

    // Generate JWT token
    const jwtSecret = await getJWTSecret();
    const tokenPayload = { 
      userId: user.id, 
      email: user.email, 
      role: userRole 
    };
    console.log('JWT token payload:', tokenPayload);
    
    const token = jwt.sign(
      tokenPayload,
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log(`✅ User logged in successfully: ${user.email}`);
    console.log(`   Role: ${userRole}`);
    console.log(`   Token expires in: ${process.env.JWT_EXPIRE || '7d'}`);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole
      },
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  } catch (error) {
    console.error('=== SEQUELIZE LOGIN ERROR ===');
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    console.log('=== SEQUELIZE GET PROFILE ===');
    
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided in profile request');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log(`Token received: ${token.substring(0, 20)}...`);
    
    // Verify token
    const jwtSecret = await getJWTSecret();
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
      console.log(`Token verified for userId: ${decoded.userId}`);
    } catch (jwtError) {
      console.error('Token verification failed:', jwtError.name, jwtError.message);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      throw jwtError;
    }
    
    // Get user with addresses
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: UserAddress,
          as: 'addresses',
          required: false
        }
      ]
    });
    
    if (!user) {
      console.error(`User not found for userId: ${decoded.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log(`User account is deactivated: ${user.email}`);
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const userData = user.toJSON();
    console.log(`✅ Profile retrieved for: ${user.email}`);
    res.json(userData);
  } catch (error) {
    console.error('=== SEQUELIZE PROFILE ERROR ===');
    console.error('Error getting profile:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Error getting profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    console.log('=== SEQUELIZE UPDATE PROFILE ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const jwtSecret = await getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, email, address, city, state, pincode } = req.body;
    console.log('📥 Received update data:', { name, phone, email, address, city, state, pincode });
    const updateData = {};

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: user.id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      updateData.email = email;
    }

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) {
      updateData.city = city && city.trim() ? city.trim() : null; // Save trimmed value or null if empty
    }
    if (state !== undefined) {
      updateData.state = state && state.trim() ? state.trim() : null; // Save trimmed value or null if empty
    }
    if (pincode !== undefined) {
      updateData.pincode = pincode && pincode.trim() ? pincode.trim() : null; // Save trimmed value or null if empty
    }
    
    console.log('📝 Update data:', updateData);

    // Update user
    if (Object.keys(updateData).length === 0) {
      console.log('⚠️  No fields to update');
      return res.status(400).json({ message: 'No fields provided to update' });
    }
    
    console.log('💾 Updating user with data:', updateData);
    
    // Update using setValues and save to ensure all fields are updated
    try {
      // Set all values directly on the instance
      Object.keys(updateData).forEach(key => {
        user.setDataValue(key, updateData[key]);
      });
      
      // Save the changes
      await user.save();
      console.log('💾 User.save() completed');
      
      // Force reload from database to ensure we have latest data
      await user.reload();
      console.log('✅ User updated successfully, reloaded data:', {
        city: user.city || 'NULL',
        state: user.state || 'NULL',
        pincode: user.pincode || 'NULL',
        address: user.address || 'NULL'
      });
      
      // Verify the data was actually saved using raw query
      const { sequelize: dbSequelize } = require('../models');
      const [dbCheck] = await dbSequelize.query(
        'SELECT city, state, pincode, address FROM users WHERE id = ?',
        { replacements: [user.id] }
      );
      console.log('🔍 Database verification:', dbCheck[0] || 'No data found');
      
    } catch (updateError) {
      console.error('❌ Error during user.update():', updateError);
      console.error('Error stack:', updateError.stack);
      throw updateError;
    }

    // Get updated user with addresses
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: UserAddress,
          as: 'addresses',
          required: false
        }
      ]
    });

    const userJson = updatedUser.toJSON();
    console.log(`✅ Profile updated for: ${user.email}`);
    console.log(`   Updated fields:`, {
      name: userJson.name,
      phone: userJson.phone,
      address: userJson.address || 'null',
      city: userJson.city || 'null',
      state: userJson.state || 'null',
      pincode: userJson.pincode || 'null'
    });
    
    res.json({
      message: 'Profile updated successfully',
      user: userJson
    });
  } catch (error) {
    console.error('=== SEQUELIZE UPDATE PROFILE ERROR ===');
    console.error('Error updating profile:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Change password
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    console.log('=== SEQUELIZE CHANGE PASSWORD ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const jwtSecret = await getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({ password: hashedNewPassword });

    console.log(`Password changed for: ${user.email}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('=== SEQUELIZE CHANGE PASSWORD ERROR ===');
    console.error('Error changing password:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Error changing password' });
  }
});

module.exports = router;
