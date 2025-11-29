const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, devBypass, devBypassAdmin } = require('../middleware/auth');

// Get social media accounts
router.get('/accounts', devBypassAdmin, async (req, res) => {
  try {
    const accounts = await db.query(`
      SELECT 
        sa.*,
        JSON_EXTRACT(sa.platform_settings, '$.username') as username,
        JSON_EXTRACT(sa.platform_settings, '$.bio') as bio,
        JSON_EXTRACT(sa.platform_settings, '$.profile_image') as profile_image
      FROM social_accounts sa
      ORDER BY sa.platform ASC, sa.created_at DESC
    `);

    // Parse platform settings for each account
    accounts.forEach(account => {
      account.platform_settings = JSON.parse(account.platform_settings || '{}');
    });

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    res.status(500).json({ message: 'Error fetching social accounts', error: error.message });
  }
});

// Connect social media account
router.post('/accounts/connect', devBypassAdmin, [
  body('platform').isIn(['instagram', 'facebook', 'tiktok', 'twitter', 'youtube']).withMessage('Valid platform is required'),
  body('access_token').trim().isLength({ min: 10 }).withMessage('Valid access token is required'),
  body('platform_settings').isObject().withMessage('Valid platform settings are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, access_token, platform_settings, refresh_token } = req.body;

    // Check if account already exists
    const [existingAccount] = await db.query(
      'SELECT id FROM social_accounts WHERE platform = ? AND JSON_EXTRACT(platform_settings, "$.username") = ?',
      [platform, platform_settings.username]
    );

    if (existingAccount) {
      return res.status(400).json({ message: 'Account already connected' });
    }

    const result = await db.query(`
      INSERT INTO social_accounts (
        platform, access_token, refresh_token, platform_settings, 
        is_active, last_sync, created_at
      ) VALUES (?, ?, ?, ?, true, NOW(), NOW())
    `, [
      platform, 
      access_token, 
      refresh_token || null, 
      JSON.stringify(platform_settings)
    ]);

    res.status(201).json({
      message: 'Account connected successfully',
      account: {
        id: result.insertId,
        platform,
        username: platform_settings.username
      }
    });
  } catch (error) {
    console.error('Error connecting account:', error);
    res.status(500).json({ message: 'Error connecting account', error: error.message });
  }
});

// Disconnect social media account
router.delete('/accounts/:id', devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [account] = await db.query('SELECT id FROM social_accounts WHERE id = ?', [id]);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await db.query('UPDATE social_accounts SET is_active = false, updated_at = NOW() WHERE id = ?', [id]);

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ message: 'Error disconnecting account', error: error.message });
  }
});

// Get social media posts
router.get('/posts', devBypassAdmin, async (req, res) => {
  try {
    const { platform, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (platform && platform !== 'all') {
      whereClause += ' AND platform = ?';
      params.push(platform);
    }

    if (type && type !== 'all') {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const posts = await db.query(`
      SELECT 
        sp.*,
        JSON_EXTRACT(sp.content, '$.text') as content_text,
        JSON_EXTRACT(sp.content, '$.hashtags') as hashtags,
        JSON_EXTRACT(sp.media, '$.images') as images,
        JSON_EXTRACT(sp.products, '$') as products
      FROM social_posts sp
      ${whereClause}
      ORDER BY sp.published_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM social_posts sp
      ${whereClause}
    `, params);

    // Parse JSON fields
    posts.forEach(post => {
      post.content = JSON.parse(post.content || '{}');
      post.media = JSON.parse(post.media || '{}');
      post.products = JSON.parse(post.products || '[]');
    });

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit),
        totalPosts: countResult.total,
        hasNext: page < Math.ceil(countResult.total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

// Create social media post
router.post('/posts', devBypassAdmin, [
  body('platform').isIn(['instagram', 'facebook', 'tiktok', 'twitter', 'youtube']).withMessage('Valid platform is required'),
  body('type').isIn(['post', 'story', 'reel', 'video']).withMessage('Valid post type is required'),
  body('content').isObject().withMessage('Valid content object is required'),
  body('scheduled_at').optional().isISO8601().withMessage('Valid scheduled date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      platform,
      type,
      content,
      media,
      products,
      hashtags,
      scheduled_at,
      account_id
    } = req.body;

    const result = await db.query(`
      INSERT INTO social_posts (
        platform, type, content, media, products, hashtags,
        scheduled_at, account_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW())
    `, [
      platform,
      type,
      JSON.stringify(content),
      JSON.stringify(media || {}),
      JSON.stringify(products || []),
      JSON.stringify(hashtags || []),
      scheduled_at || null,
      account_id || null
    ]);

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: result.insertId,
        platform,
        type,
        status: 'draft'
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// Update social media post
router.put('/posts/:id', devBypassAdmin, [
  body('content').optional().isObject(),
  body('status').optional().isIn(['draft', 'scheduled', 'published', 'failed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content, media, products, hashtags, scheduled_at, status } = req.body;

    // Check if post exists
    const [existingPost] = await db.query('SELECT id FROM social_posts WHERE id = ?', [id]);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(JSON.stringify(content));
    }

    if (media !== undefined) {
      updateFields.push('media = ?');
      updateValues.push(JSON.stringify(media));
    }

    if (products !== undefined) {
      updateFields.push('products = ?');
      updateValues.push(JSON.stringify(products));
    }

    if (hashtags !== undefined) {
      updateFields.push('hashtags = ?');
      updateValues.push(JSON.stringify(hashtags));
    }

    if (scheduled_at !== undefined) {
      updateFields.push('scheduled_at = ?');
      updateValues.push(scheduled_at);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await db.query(`
      UPDATE social_posts 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
});

// Get campaigns
router.get('/campaigns', devBypassAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const campaigns = await db.query(`
      SELECT 
        sc.*,
        JSON_EXTRACT(sc.platforms, '$') as platforms,
        JSON_EXTRACT(sc.influencers, '$') as influencers,
        COUNT(sp.id) as posts_count
      FROM social_campaigns sc
      LEFT JOIN social_posts sp ON sc.id = sp.campaign_id
      ${whereClause}
      GROUP BY sc.id
      ORDER BY sc.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM social_campaigns sc
      ${whereClause}
    `, params);

    // Parse JSON fields
    campaigns.forEach(campaign => {
      campaign.platforms = JSON.parse(campaign.platforms || '[]');
      campaign.influencers = JSON.parse(campaign.influencers || '[]');
    });

    res.json({
      campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit),
        totalCampaigns: countResult.total,
        hasNext: page < Math.ceil(countResult.total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
  }
});

// Create campaign
router.post('/campaigns', devBypassAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Campaign name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Campaign description is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('budget').isNumeric().withMessage('Valid budget is required'),
  body('platforms').isArray().withMessage('Valid platforms array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      start_date,
      end_date,
      budget,
      platforms,
      influencers,
      target_audience
    } = req.body;

    const result = await db.query(`
      INSERT INTO social_campaigns (
        name, description, start_date, end_date, budget,
        platforms, influencers, target_audience, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `, [
      name,
      description,
      start_date,
      end_date,
      budget,
      JSON.stringify(platforms),
      JSON.stringify(influencers || []),
      JSON.stringify(target_audience || {})
    ]);

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: {
        id: result.insertId,
        name,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Error creating campaign', error: error.message });
  }
});

// Get influencers
router.get('/influencers', devBypassAdmin, async (req, res) => {
  try {
    const { platform, category, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (platform && platform !== 'all') {
      whereClause += ' AND platform = ?';
      params.push(platform);
    }

    if (category && category !== 'all') {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const influencers = await db.query(`
      SELECT 
        si.*,
        JSON_EXTRACT(si.contact_info, '$') as contact_info,
        JSON_EXTRACT(si.social_stats, '$') as social_stats
      FROM social_influencers si
      ${whereClause}
      ORDER BY si.followers DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM social_influencers si
      ${whereClause}
    `, params);

    // Parse JSON fields
    influencers.forEach(influencer => {
      influencer.contact_info = JSON.parse(influencer.contact_info || '{}');
      influencer.social_stats = JSON.parse(influencer.social_stats || '{}');
    });

    res.json({
      influencers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit),
        totalInfluencers: countResult.total,
        hasNext: page < Math.ceil(countResult.total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching influencers:', error);
    res.status(500).json({ message: 'Error fetching influencers', error: error.message });
  }
});

// Create influencer
router.post('/influencers', devBypassAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Influencer name is required'),
  body('username').trim().isLength({ min: 2 }).withMessage('Username is required'),
  body('platform').isIn(['instagram', 'facebook', 'tiktok', 'twitter', 'youtube']).withMessage('Valid platform is required'),
  body('followers').isNumeric().withMessage('Valid followers count is required'),
  body('engagement_rate').isNumeric().withMessage('Valid engagement rate is required'),
  body('rate').isNumeric().withMessage('Valid rate is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      username,
      platform,
      followers,
      engagement_rate,
      rate,
      category,
      contact_info,
      social_stats
    } = req.body;

    const result = await db.query(`
      INSERT INTO social_influencers (
        name, username, platform, followers, engagement_rate, rate,
        category, contact_info, social_stats, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `, [
      name,
      username,
      platform,
      followers,
      engagement_rate,
      rate,
      category || 'General',
      JSON.stringify(contact_info || {}),
      JSON.stringify(social_stats || {}),
    ]);

    res.status(201).json({
      message: 'Influencer added successfully',
      influencer: {
        id: result.insertId,
        name,
        username,
        platform
      }
    });
  } catch (error) {
    console.error('Error creating influencer:', error);
    res.status(500).json({ message: 'Error creating influencer', error: error.message });
  }
});

// Get social media analytics
router.get('/analytics', devBypassAdmin, async (req, res) => {
  try {
    const { period = '30d', platform } = req.query;
    
    // Calculate date range based on period
    let dateCondition = '';
    if (period === '7d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === '90d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    let platformCondition = '';
    if (platform && platform !== 'all') {
      platformCondition = 'AND platform = ?';
    }

    // Get total followers across all platforms
    const [totalFollowers] = await db.query(`
      SELECT SUM(JSON_EXTRACT(platform_settings, '$.followers')) as total_followers
      FROM social_accounts 
      WHERE is_active = true
    `);

    // Get engagement metrics
    const [engagementStats] = await db.query(`
      SELECT 
        AVG(JSON_EXTRACT(analytics, '$.engagement_rate')) as avg_engagement,
        SUM(JSON_EXTRACT(analytics, '$.likes')) as total_likes,
        SUM(JSON_EXTRACT(analytics, '$.comments')) as total_comments,
        SUM(JSON_EXTRACT(analytics, '$.shares')) as total_shares
      FROM social_posts 
      WHERE status = 'published' ${dateCondition}
    `);

    // Get platform breakdown
    const [platformBreakdown] = await db.query(`
      SELECT 
        platform,
        COUNT(*) as posts_count,
        AVG(JSON_EXTRACT(analytics, '$.engagement_rate')) as avg_engagement,
        SUM(JSON_EXTRACT(analytics, '$.reach')) as total_reach
      FROM social_posts 
      WHERE status = 'published' ${dateCondition} ${platformCondition}
      GROUP BY platform
    `, platform ? [platform] : []);

    // Get top performing posts
    const [topPosts] = await db.query(`
      SELECT 
        id,
        platform,
        JSON_EXTRACT(content, '$.text') as content_text,
        JSON_EXTRACT(analytics, '$.engagement_rate') as engagement_rate,
        JSON_EXTRACT(analytics, '$.reach') as reach
      FROM social_posts 
      WHERE status = 'published' ${dateCondition} ${platformCondition}
      ORDER BY JSON_EXTRACT(analytics, '$.engagement_rate') DESC
      LIMIT 10
    `, platform ? [platform] : []);

    // Get campaign performance
    const [campaignStats] = await db.query(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(budget) as total_budget,
        SUM(spent) as total_spent,
        AVG(conversion_rate) as avg_conversion_rate
      FROM social_campaigns 
      WHERE 1=1 ${dateCondition}
    `);

    res.json({
      period,
      totalFollowers: totalFollowers.total_followers || 0,
      avgEngagement: engagementStats.avg_engagement || 0,
      totalLikes: engagementStats.total_likes || 0,
      totalComments: engagementStats.total_comments || 0,
      totalShares: engagementStats.total_shares || 0,
      platformBreakdown,
      topPosts,
      campaignStats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Sync social media data
router.post('/sync/:accountId', devBypassAdmin, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Check if account exists
    const [account] = await db.query('SELECT * FROM social_accounts WHERE id = ? AND is_active = true', [accountId]);
    if (!account) {
      return res.status(404).json({ message: 'Account not found or inactive' });
    }

    // This would typically call the respective social media API
    // For now, we'll simulate a successful sync
    await db.query('UPDATE social_accounts SET last_sync = NOW(), updated_at = NOW() WHERE id = ?', [accountId]);

    res.json({ 
      message: 'Account synced successfully',
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing account:', error);
    res.status(500).json({ message: 'Error syncing account', error: error.message });
  }
});

// Upload media for posts
router.post('/upload', devBypassAdmin, async (req, res) => {
  try {
    // This would typically handle file uploads
    // For now, we'll return a mock response
    const { type, filename, size } = req.body;
    
    const mockUrl = `/uploads/social/${type}/${filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      url: mockUrl,
      type,
      filename,
      size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

module.exports = router;

















