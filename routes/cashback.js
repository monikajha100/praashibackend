const express = require('express');
const router = express.Router();
const { Cashback, Offer, Order } = require('../models');
const { Op } = require('sequelize');
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
  const { User } = require('../models');
  const user = await User.findByPk(decoded.userId);
  return user;
};

// Get user's cashback balance and history
router.get('/balance', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Calculate total available cashback
    const availableCashback = await Cashback.sum('amount', {
      where: {
        user_id: user.id,
        status: 'credited',
        [Op.or]: [
          { expiry_date: null },
          { expiry_date: { [Op.gt]: new Date() } }
        ]
      }
    });

    // Get cashback history
    const cashbackHistory = await Cashback.findAll({
      where: { user_id: user.id },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'total_amount']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    res.json({
      balance: parseFloat(availableCashback || 0),
      history: cashbackHistory.map(item => ({
        id: item.id,
        amount: parseFloat(item.amount),
        status: item.status,
        description: item.description,
        expiry_date: item.expiry_date,
        order_number: item.order?.order_number,
        created_at: item.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching cashback balance:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Error fetching cashback balance', error: error.message });
  }
});

// Get available offers
router.get('/offers', async (req, res) => {
  try {
    const now = new Date();
    
    const offers = await Offer.findAll({
      where: {
        is_active: true,
        valid_from: { [Op.lte]: now },
        valid_to: { [Op.gte]: now },
        [Op.or]: [
          { usage_limit: null },
          { usage_count: { [Op.lt]: require('sequelize').col('usage_limit') } }
        ]
      },
      order: [['valid_to', 'ASC']]
    });

    res.json(offers.map(offer => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      offer_type: offer.offer_type,
      discount_percent: offer.discount_percent,
      discount_amount: offer.discount_amount,
      cashback_percent: offer.cashback_percent,
      min_purchase_amount: parseFloat(offer.min_purchase_amount || 0),
      max_discount: offer.max_discount ? parseFloat(offer.max_discount) : null,
      valid_from: offer.valid_from,
      valid_to: offer.valid_to,
      coupon_code: offer.coupon_code
    })));
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ message: 'Error fetching offers', error: error.message });
  }
});

// Apply cashback to order (this would typically be called during checkout)
router.post('/apply', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { amount, order_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid cashback amount' });
    }

    // Get available cashback
    const availableCashback = await Cashback.sum('amount', {
      where: {
        user_id: user.id,
        status: 'credited',
        [Op.or]: [
          { expiry_date: null },
          { expiry_date: { [Op.gt]: new Date() } }
        ]
      }
    });

    const availableAmount = parseFloat(availableCashback || 0);

    if (amount > availableAmount) {
      return res.status(400).json({ 
        message: `Insufficient cashback balance. Available: ₹${availableAmount}` 
      });
    }

    // Mark cashback as used (this is simplified - in production you'd want to track partial usage)
    // For now, we'll create a negative entry
    await Cashback.create({
      user_id: user.id,
      order_id: order_id || null,
      amount: -amount,
      status: 'used',
      description: `Applied to order ${order_id || 'pending'}`
    });

    res.json({
      message: 'Cashback applied successfully',
      amount_applied: amount,
      remaining_balance: availableAmount - amount
    });
  } catch (error) {
    console.error('Error applying cashback:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Error applying cashback', error: error.message });
  }
});

module.exports = router;

