const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, devBypass, devBypassAdmin } = require('../middleware/auth');

// Get tax settings (public endpoint)
router.get('/tax-settings', async (req, res) => {
  try {
    const settings = await db.query(`
      SELECT setting_key, setting_value
      FROM site_settings
      WHERE setting_key IN ('tax_enabled', 'tax_rate')
    `);
    
    const settingsObj = {
      tax_enabled: 'false', // Default to disabled
      tax_rate: '18' // Default rate if enabled
    };
    
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });
    
    // Return tax_enabled as boolean and tax_rate as number
    res.json({
      tax_enabled: settingsObj.tax_enabled === 'true',
      tax_rate: parseFloat(settingsObj.tax_rate || '18')
    });
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    // Return defaults on error
    res.json({
      tax_enabled: false,
      tax_rate: 18
    });
  }
});

// Get storefront settings
router.get('/settings', devBypassAdmin, async (req, res) => {
  try {
    const [settings] = await db.query(`
      SELECT 
        theme_id,
        homepage_layout,
        custom_css,
        custom_js,
        logo_url,
        favicon_url,
        site_title,
        site_description,
        contact_email,
        contact_phone,
        social_links,
        seo_settings,
        created_at,
        updated_at
      FROM storefront_settings 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        theme_id: 1,
        homepage_layout: 'default',
        custom_css: '',
        custom_js: '',
        logo_url: '',
        favicon_url: '',
        site_title: 'Praashi by Supal',
        site_description: 'Premium home decor and furniture',
        contact_email: 'info@praashibysupal.com',
        contact_phone: '+91-9876543210',
        social_links: JSON.stringify({
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: ''
        }),
        seo_settings: JSON.stringify({
          meta_title: 'Praashi by Supal - Premium Home Decor',
          meta_description: 'Discover premium home decor and furniture at Praashi by Supal',
          meta_keywords: 'home decor, furniture, premium, interior design'
        })
      });
    }

    // Parse JSON fields
    settings.social_links = JSON.parse(settings.social_links || '{}');
    settings.seo_settings = JSON.parse(settings.seo_settings || '{}');

    res.json(settings);
  } catch (error) {
    console.error('Error fetching storefront settings:', error);
    res.status(500).json({ message: 'Error fetching storefront settings', error: error.message });
  }
});

// Update storefront settings
router.put('/settings', devBypassAdmin, [
  body('site_title').optional().trim().isLength({ min: 2 }).withMessage('Site title must be at least 2 characters'),
  body('site_description').optional().trim().isLength({ min: 10 }).withMessage('Site description must be at least 10 characters'),
  body('contact_email').optional().isEmail().withMessage('Valid email is required'),
  body('contact_phone').optional().trim().isLength({ min: 10 }).withMessage('Valid phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      theme_id,
      homepage_layout,
      custom_css,
      custom_js,
      logo_url,
      favicon_url,
      site_title,
      site_description,
      contact_email,
      contact_phone,
      social_links,
      seo_settings
    } = req.body;

    // Check if settings exist
    const [existingSettings] = await db.query('SELECT id FROM storefront_settings ORDER BY updated_at DESC LIMIT 1');

    if (existingSettings) {
      // Update existing settings
      await db.query(`
        UPDATE storefront_settings 
        SET 
          theme_id = ?, homepage_layout = ?, custom_css = ?, custom_js = ?,
          logo_url = ?, favicon_url = ?, site_title = ?, site_description = ?,
          contact_email = ?, contact_phone = ?, social_links = ?, seo_settings = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        theme_id, homepage_layout, custom_css, custom_js,
        logo_url, favicon_url, site_title, site_description,
        contact_email, contact_phone, 
        JSON.stringify(social_links || {}),
        JSON.stringify(seo_settings || {}),
        existingSettings.id
      ]);
    } else {
      // Create new settings
      await db.query(`
        INSERT INTO storefront_settings (
          theme_id, homepage_layout, custom_css, custom_js,
          logo_url, favicon_url, site_title, site_description,
          contact_email, contact_phone, social_links, seo_settings,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        theme_id, homepage_layout, custom_css, custom_js,
        logo_url, favicon_url, site_title, site_description,
        contact_email, contact_phone,
        JSON.stringify(social_links || {}),
        JSON.stringify(seo_settings || {})
      ]);
    }

    res.json({ message: 'Storefront settings updated successfully' });
  } catch (error) {
    console.error('Error updating storefront settings:', error);
    res.status(500).json({ message: 'Error updating storefront settings', error: error.message });
  }
});

// Get themes
router.get('/themes', devBypassAdmin, async (req, res) => {
  try {
    const themes = await db.query(`
      SELECT 
        t.*,
        COUNT(ts.id) as usage_count
      FROM themes t
      LEFT JOIN storefront_settings ts ON t.id = ts.theme_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);

    res.json(themes);
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ message: 'Error fetching themes', error: error.message });
  }
});

// Create theme
router.post('/themes', devBypassAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Theme name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Theme description is required'),
  body('colors').isObject().withMessage('Valid colors object is required'),
  body('fonts').isObject().withMessage('Valid fonts object is required'),
  body('layout').isIn(['grid', 'sidebar', 'masonry']).withMessage('Valid layout type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, colors, fonts, layout, preview_image } = req.body;

    const result = await db.query(`
      INSERT INTO themes (name, description, colors, fonts, layout, preview_image, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, true, NOW())
    `, [
      name, description, 
      JSON.stringify(colors), 
      JSON.stringify(fonts), 
      layout, 
      preview_image || ''
    ]);

    res.status(201).json({
      message: 'Theme created successfully',
      theme: {
        id: result.insertId,
        name,
        description,
        layout
      }
    });
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ message: 'Error creating theme', error: error.message });
  }
});

// Get homepage sections
router.get('/sections', devBypassAdmin, async (req, res) => {
  try {
    const sections = await db.query(`
      SELECT 
        s.*,
        JSON_EXTRACT(s.content, '$.title') as content_title,
        JSON_EXTRACT(s.content, '$.subtitle') as content_subtitle
      FROM homepage_sections s
      ORDER BY s.position ASC
    `);

    // Parse content JSON for each section
    sections.forEach(section => {
      section.content = JSON.parse(section.content || '{}');
    });

    res.json(sections);
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    res.status(500).json({ message: 'Error fetching homepage sections', error: error.message });
  }
});

// Update homepage section
router.put('/sections/:id', devBypassAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('content').optional().isObject(),
  body('is_active').optional().isBoolean(),
  body('position').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, content, is_active, position } = req.body;

    // Check if section exists
    const [existingSection] = await db.query('SELECT id FROM homepage_sections WHERE id = ?', [id]);
    if (!existingSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(JSON.stringify(content));
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await db.query(`
      UPDATE homepage_sections 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({ message: 'Section updated successfully' });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ message: 'Error updating section', error: error.message });
  }
});

// Create homepage section
router.post('/sections', devBypassAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Section name is required'),
  body('type').isIn(['banner', 'products', 'categories', 'testimonials', 'custom']).withMessage('Valid section type is required'),
  body('content').isObject().withMessage('Valid content object is required'),
  body('position').isInt({ min: 1 }).withMessage('Valid position is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, content, position, is_active = true } = req.body;

    const result = await db.query(`
      INSERT INTO homepage_sections (name, type, content, position, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [name, type, JSON.stringify(content), position, is_active]);

    res.status(201).json({
      message: 'Section created successfully',
      section: {
        id: result.insertId,
        name,
        type,
        position
      }
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ message: 'Error creating section', error: error.message });
  }
});

// Get widgets
router.get('/widgets', devBypassAdmin, async (req, res) => {
  try {
    const widgets = await db.query(`
      SELECT 
        w.*,
        JSON_EXTRACT(w.settings, '$.title') as settings_title,
        JSON_EXTRACT(w.settings, '$.placeholder') as settings_placeholder
      FROM widgets w
      ORDER BY w.position ASC, w.name ASC
    `);

    // Parse settings JSON for each widget
    widgets.forEach(widget => {
      widget.settings = JSON.parse(widget.settings || '{}');
    });

    res.json(widgets);
  } catch (error) {
    console.error('Error fetching widgets:', error);
    res.status(500).json({ message: 'Error fetching widgets', error: error.message });
  }
});

// Update widget
router.put('/widgets/:id', devBypassAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('settings').optional().isObject(),
  body('is_active').optional().isBoolean(),
  body('position').optional().isIn(['header', 'footer', 'sidebar', 'content'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, settings, is_active, position } = req.body;

    // Check if widget exists
    const [existingWidget] = await db.query('SELECT id FROM widgets WHERE id = ?', [id]);
    if (!existingWidget) {
      return res.status(404).json({ message: 'Widget not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (settings !== undefined) {
      updateFields.push('settings = ?');
      updateValues.push(JSON.stringify(settings));
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await db.query(`
      UPDATE widgets 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({ message: 'Widget updated successfully' });
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(500).json({ message: 'Error updating widget', error: error.message });
  }
});

// Get storefront analytics
router.get('/analytics', devBypassAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    let dateCondition = '';
    if (period === '7d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === '90d') {
      dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // Get page views and unique visitors
    const [trafficStats] = await db.query(`
      SELECT 
        COUNT(*) as page_views,
        COUNT(DISTINCT user_id) as unique_visitors,
        AVG(session_duration) as avg_session_duration
      FROM page_views 
      WHERE 1=1 ${dateCondition}
    `);

    // Get top pages
    const [topPages] = await db.query(`
      SELECT 
        page_url,
        COUNT(*) as views,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM page_views WHERE 1=1 ${dateCondition}), 2) as percentage
      FROM page_views 
      WHERE 1=1 ${dateCondition}
      GROUP BY page_url
      ORDER BY views DESC
      LIMIT 10
    `);

    // Get device breakdown
    const [deviceBreakdown] = await db.query(`
      SELECT 
        device_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM page_views WHERE 1=1 ${dateCondition}), 2) as percentage
      FROM page_views 
      WHERE 1=1 ${dateCondition}
      GROUP BY device_type
    `);

    // Get traffic sources
    const [trafficSources] = await db.query(`
      SELECT 
        traffic_source,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM page_views WHERE 1=1 ${dateCondition}), 2) as percentage
      FROM page_views 
      WHERE 1=1 ${dateCondition}
      GROUP BY traffic_source
    `);

    // Calculate bounce rate (sessions with only 1 page view)
    const [bounceRate] = await db.query(`
      SELECT 
        ROUND(
          (SELECT COUNT(*) FROM (
            SELECT session_id 
            FROM page_views 
            WHERE 1=1 ${dateCondition}
            GROUP BY session_id 
            HAVING COUNT(*) = 1
          ) as single_page_sessions) * 100.0 / 
          (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE 1=1 ${dateCondition}), 2
        ) as bounce_rate
    `);

    res.json({
      period,
      pageViews: trafficStats.page_views || 0,
      uniqueVisitors: trafficStats.unique_visitors || 0,
      avgSessionDuration: trafficStats.avg_session_duration || 0,
      bounceRate: bounceRate.bounce_rate || 0,
      topPages,
      deviceBreakdown,
      trafficSources
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Upload storefront assets (logo, favicon, etc.)
router.post('/upload', devBypassAdmin, async (req, res) => {
  try {
    // This would typically handle file uploads
    // For now, we'll return a mock response
    const { type, filename } = req.body;
    
    const mockUrl = `/uploads/storefront/${type}/${filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      url: mockUrl,
      type,
      filename
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

module.exports = router;



