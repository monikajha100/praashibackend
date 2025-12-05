const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { devBypassAdmin } = require('../middleware/auth');

// Get all Instagram posts with product tags
router.get('/posts', devBypassAdmin, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      whereClause += ' AND post_type = ?';
      params.push(type);
    }

    const query = `
      SELECT 
        ip.*,
        COUNT(DISTINCT JSON_EXTRACT(ip.tagged_products, '$[*].product_id')) as products_count
      FROM instagram_posts ip
      ${whereClause}
      GROUP BY ip.id
      ORDER BY ip.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const posts = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM instagram_posts ip
      ${whereClause}
    `, params);

    // Parse JSON fields
    posts.forEach(post => {
      if (post.hashtags) post.hashtags = JSON.parse(post.hashtags);
      if (post.tagged_products) post.tagged_products = JSON.parse(post.tagged_products);
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
    console.error('Error fetching Instagram posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

// Get single Instagram post with full details
router.get('/posts/:id', devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [post] = await db.query(`
      SELECT ip.*
      FROM instagram_posts ip
      WHERE ip.id = ?
    `, [id]);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Parse JSON fields
    if (post.hashtags) post.hashtags = JSON.parse(post.hashtags);
    if (post.tagged_products) post.tagged_products = JSON.parse(post.tagged_products);

    // Get product details for tagged products
    if (post.tagged_products && post.tagged_products.length > 0) {
      const productIds = post.tagged_products.map(tp => tp.product_id);
      const products = await db.query(`
        SELECT id, name, price, category, images, stock
        FROM products
        WHERE id IN (?)
      `, [productIds]);

      products.forEach(product => {
        if (product.images) product.images = JSON.parse(product.images);
      });

      // Merge product details with tag positions
      post.tagged_products = post.tagged_products.map(tp => {
        const product = products.find(p => p.id === tp.product_id);
        return {
          ...tp,
          product
        };
      });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching Instagram post:', error);
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
});

// Create new Instagram post
router.post('/posts', devBypassAdmin, [
  body('caption').optional().isString(),
  body('media_url').notEmpty().withMessage('Media URL is required'),
  body('media_type').isIn(['IMAGE', 'VIDEO', 'CAROUSEL']).withMessage('Valid media type is required'),
  body('post_type').isIn(['FEED', 'STORY', 'REEL']).withMessage('Valid post type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      instagram_id,
      caption,
      media_url,
      media_type,
      thumbnail_url,
      post_type,
      status,
      scheduled_at,
      hashtags,
      tagged_products,
      notes
    } = req.body;

    const is_shoppable = tagged_products && tagged_products.length > 0;

    const result = await db.query(`
      INSERT INTO instagram_posts (
        instagram_id, caption, media_url, media_type, thumbnail_url,
        post_type, status, scheduled_at, hashtags, tagged_products,
        is_shoppable, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      instagram_id || null,
      caption || null,
      media_url,
      media_type,
      thumbnail_url || null,
      post_type,
      status || 'DRAFT',
      scheduled_at || null,
      JSON.stringify(hashtags || []),
      JSON.stringify(tagged_products || []),
      is_shoppable,
      notes || null
    ]);

    res.status(201).json({
      message: 'Instagram post created successfully',
      post: {
        id: result.insertId,
        media_type,
        post_type,
        status: status || 'DRAFT',
        is_shoppable
      }
    });
  } catch (error) {
    console.error('Error creating Instagram post:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// Update Instagram post
router.put('/posts/:id', devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      caption,
      media_url,
      thumbnail_url,
      status,
      scheduled_at,
      published_at,
      hashtags,
      tagged_products,
      likes_count,
      comments_count,
      shares_count,
      reach,
      impressions,
      engagement_rate,
      notes
    } = req.body;

    // Check if post exists
    const [existingPost] = await db.query('SELECT id FROM instagram_posts WHERE id = ?', [id]);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (caption !== undefined) {
      updateFields.push('caption = ?');
      updateValues.push(caption);
    }

    if (media_url !== undefined) {
      updateFields.push('media_url = ?');
      updateValues.push(media_url);
    }

    if (thumbnail_url !== undefined) {
      updateFields.push('thumbnail_url = ?');
      updateValues.push(thumbnail_url);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (scheduled_at !== undefined) {
      updateFields.push('scheduled_at = ?');
      updateValues.push(scheduled_at);
    }

    if (published_at !== undefined) {
      updateFields.push('published_at = ?');
      updateValues.push(published_at);
    }

    if (hashtags !== undefined) {
      updateFields.push('hashtags = ?');
      updateValues.push(JSON.stringify(hashtags));
    }

    if (tagged_products !== undefined) {
      updateFields.push('tagged_products = ?');
      updateValues.push(JSON.stringify(tagged_products));
      updateFields.push('is_shoppable = ?');
      updateValues.push(tagged_products.length > 0);
    }

    if (likes_count !== undefined) {
      updateFields.push('likes_count = ?');
      updateValues.push(likes_count);
    }

    if (comments_count !== undefined) {
      updateFields.push('comments_count = ?');
      updateValues.push(comments_count);
    }

    if (shares_count !== undefined) {
      updateFields.push('shares_count = ?');
      updateValues.push(shares_count);
    }

    if (reach !== undefined) {
      updateFields.push('reach = ?');
      updateValues.push(reach);
    }

    if (impressions !== undefined) {
      updateFields.push('impressions = ?');
      updateValues.push(impressions);
    }

    if (engagement_rate !== undefined) {
      updateFields.push('engagement_rate = ?');
      updateValues.push(engagement_rate);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await db.query(`
      UPDATE instagram_posts 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating Instagram post:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
});

// Delete Instagram post
router.delete('/posts/:id', devBypassAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existingPost] = await db.query('SELECT id FROM instagram_posts WHERE id = ?', [id]);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await db.query('DELETE FROM instagram_posts WHERE id = ?', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting Instagram post:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
});

// Get products available for tagging
router.get('/products/available', devBypassAdmin, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE stock > 0';
    let params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'all') {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    const products = await db.query(`
      SELECT 
        id, name, category, subcategory, price, images, stock, sku
      FROM products
      ${whereClause}
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    products.forEach(product => {
      if (product.images) product.images = JSON.parse(product.images);
    });

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM products
      ${whereClause}
    `, params);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit),
        totalProducts: countResult.total
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get Instagram analytics
router.get('/analytics', devBypassAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    let dateCondition = '';
    if (period === '7d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === '90d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // Get overall stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN is_shoppable = 1 THEN 1 ELSE 0 END) as shoppable_posts,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        SUM(shares_count) as total_shares,
        SUM(reach) as total_reach,
        SUM(impressions) as total_impressions,
        AVG(engagement_rate) as avg_engagement_rate
      FROM instagram_posts
      WHERE status = 'PUBLISHED' ${dateCondition}
    `);

    // Get post type breakdown
    const postTypeBreakdown = await db.query(`
      SELECT 
        post_type,
        COUNT(*) as count,
        AVG(engagement_rate) as avg_engagement
      FROM instagram_posts
      WHERE status = 'PUBLISHED' ${dateCondition}
      GROUP BY post_type
    `);

    // Get top performing posts
    const topPosts = await db.query(`
      SELECT 
        id, caption, media_url, post_type, engagement_rate, 
        likes_count, comments_count, reach
      FROM instagram_posts
      WHERE status = 'PUBLISHED' ${dateCondition}
      ORDER BY engagement_rate DESC
      LIMIT 10
    `);

    // Get product tagging stats
    const [productStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT id) as posts_with_products,
        AVG(JSON_LENGTH(tagged_products)) as avg_products_per_post
      FROM instagram_posts
      WHERE is_shoppable = 1 AND status = 'PUBLISHED' ${dateCondition}
    `);

    res.json({
      period,
      stats: stats || {},
      postTypeBreakdown,
      topPosts,
      productStats: productStats || {}
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

module.exports = router;
