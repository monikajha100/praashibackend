const express = require('express');
const router = express.Router();
const { Banner } = require('../models');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const bannersDir = path.join(__dirname, '..', 'uploads', 'banners');
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}

// Configure multer for banner uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bannersDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed!'), false);
    }
    cb(null, true);
  }
});

// Helper function to generate full URL for uploaded files
// const generateFileUrl = (filePath) => {
//   // In development, return relative path so frontend can handle the base URL
//   if (process.env.NODE_ENV !== 'production') {
//     return filePath;
//   }
//   // In production, return full URL
//   return `https://api.praashibysupal.com${filePath}`;
// };

// Get all banners (public - only active)
router.get('/', async (req, res) => {
  try {
    console.log('=== SEQUELIZE BANNERS API REQUEST ===');
    
    // Query banners - get all active banners
    // First, let's check what's actually in the database
    const allBannersCheck = await Banner.findAll({
      attributes: ['id', 'title', 'is_active', 'sort_order'],
      raw: true
    });
    console.log('All banners in database:', allBannersCheck);
    
    // Now get only active banners
    const banners = await Banner.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    
    console.log(`Query returned ${banners.length} banners with is_active: true`);

    // Convert relative image paths to absolute URLs and handle URL encoding
    const processedBanners = banners.map(banner => {
      const bannerObj = banner.toJSON();
      
      // Process image URL - handle both relative and absolute URLs
      if (bannerObj.image) {
        // If it's already an absolute URL (starts with http/https), keep it as is
        if (!bannerObj.image.startsWith('http://') && !bannerObj.image.startsWith('https://')) {
          // It's a relative path, ensure it starts with /
          bannerObj.image = bannerObj.image.startsWith('/') 
            ? bannerObj.image 
            : `/${bannerObj.image}`;
        }
        // Note: Don't double-encode URLs that are already encoded
        // The frontend's toAbsoluteImageUrl will handle the conversion to full URL
      }
      
      // Process mobile_image URL
      if (bannerObj.mobile_image) {
        if (!bannerObj.mobile_image.startsWith('http://') && !bannerObj.mobile_image.startsWith('https://')) {
          bannerObj.mobile_image = bannerObj.mobile_image.startsWith('/') 
            ? bannerObj.mobile_image 
            : `/${bannerObj.mobile_image}`;
        }
      }
      
      return bannerObj;
    });

    console.log(`Found ${processedBanners.length} active banners`);
    if (processedBanners.length > 0) {
      console.log('Banner IDs:', processedBanners.map(b => b.id));
      console.log('Banner details:', processedBanners.map(b => ({ 
        id: b.id, 
        title: b.title,
        sort_order: b.sort_order, 
        is_active: b.is_active,
        device_type: b.device_type,
        image: b.image ? (b.image.length > 100 ? b.image.substring(0, 100) + '...' : b.image) : 'NO IMAGE'
      })));
    } else {
      // Log all banners to see why none are active
      const allBanners = await Banner.findAll({
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
      });
      console.log(`Total banners in database: ${allBanners.length}`);
      console.log('All banners status:', allBanners.map(b => ({
        id: b.id,
        title: b.title,
        is_active: b.is_active,
        sort_order: b.sort_order
      })));
    }
    res.json(processedBanners);
  } catch (error) {
    console.error('=== SEQUELIZE BANNERS API ERROR ===');
    console.error('Error fetching banners:', error);
    res.status(500).json({ 
      message: 'Error fetching banners',
      error: error.message
    });
  }
});

// Get all banners (admin - includes inactive)
router.get('/admin', async (req, res) => {
  try {
    console.log('=== SEQUELIZE ADMIN BANNERS API REQUEST ===');
    
    const banners = await Banner.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    // Convert relative image paths to absolute URLs
    const processedBanners = banners.map(banner => {
      const bannerObj = banner.toJSON();
      if (bannerObj.image) {
        bannerObj.image = bannerObj.image
      }
      if (bannerObj.mobile_image) {
        bannerObj.mobile_image = bannerObj.mobile_image
      }
      return bannerObj;
    });

    console.log(`Found ${processedBanners.length} banners (admin)`);
    res.json(processedBanners);
  } catch (error) {
    console.error('=== SEQUELIZE ADMIN BANNERS API ERROR ===');
    console.error('Error fetching admin banners:', error);
    res.status(500).json({ 
      message: 'Error fetching admin banners',
      error: error.message
    });
  }
});

// Get single banner by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Convert relative image paths to absolute URLs
    const bannerObj = banner.toJSON();
    if (bannerObj.image) {
      bannerObj.image = bannerObj.image
    }
    if (bannerObj.mobile_image) {
      bannerObj.mobile_image = bannerObj.mobile_image
    }

    console.log(`Found banner: ${bannerObj.title}`);
    res.json(bannerObj);
  } catch (error) {
    console.error('Error fetching banner by ID:', error);
    res.status(500).json({ message: 'Error fetching banner' });
  }
});

// Create new banner (admin only) - with file upload support
router.post('/', upload.single('image'), [
  body('title').trim().isLength({ min: 2 }).withMessage('Banner title is required'),
  body('subtitle').optional().trim(),
  body('mobile_title').optional().trim(),
  body('mobile_subtitle').optional().trim(),
  body('mobile_image').optional().trim(),
  body('device_type').optional().isIn(['desktop', 'mobile', 'both']).withMessage('Device type must be desktop, mobile, or both'),
  body('link_url').optional().trim(),
  body('button_text').optional().trim(),
  body('sort_order').optional().isInt().withMessage('Sort order must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      subtitle, 
      mobile_title, 
      mobile_subtitle, 
      mobile_image, 
      device_type,
      link_url, 
      button_text, 
      sort_order 
    } = req.body;

    // Use uploaded file path if available, otherwise use provided image URL
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/banners/${req.file.filename}`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }

    // Parse sort_order properly - handle string "1" or number 1, default to 0 if not provided
    const parsedSortOrder = sort_order !== undefined && sort_order !== null && sort_order !== '' 
      ? parseInt(sort_order) 
      : 0;
    
    // If sort_order is 0, find the max sort_order and add 1 to place it at the end
    let finalSortOrder = parsedSortOrder;
    if (parsedSortOrder === 0) {
      const maxBanner = await Banner.findOne({
        attributes: [[Banner.sequelize.fn('MAX', Banner.sequelize.col('sort_order')), 'max_sort']],
        raw: true
      });
      const maxSort = maxBanner?.max_sort || 0;
      finalSortOrder = maxSort + 1;
    }

    const banner = await Banner.create({
      title,
      subtitle,
      image: imagePath,
      mobile_title: mobile_title || title,
      mobile_subtitle: mobile_subtitle || subtitle,
      mobile_image: mobile_image || imagePath,
      device_type: device_type || 'both',
      link_url,
      button_text,
      sort_order: finalSortOrder,
      is_active: req.body.is_active !== undefined 
        ? (req.body.is_active === true || req.body.is_active === 'true' || req.body.is_active === 1)
        : true // Default to active if not specified
    });

    console.log(`Created new banner: ${banner.title}`);
    console.log(`Banner details:`, {
      id: banner.id,
      title: banner.title,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
      image: banner.image
    });
    res.status(201).json(banner);
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.error('Error creating banner:', error);
    res.status(500).json({ message: 'Error creating banner', error: error.message });
  }
});

// Update banner (admin only) - with file upload support
router.put('/:id', upload.single('image'), [
  body('title').optional().trim().isLength({ min: 2 }),
  body('subtitle').optional().trim(),
  body('mobile_title').optional().trim(),
  body('mobile_subtitle').optional().trim(),
  body('mobile_image').optional().trim(),
  body('device_type').optional().isIn(['desktop', 'mobile', 'both']),
  body('link_url').optional().trim(),
  body('button_text').optional().trim(),
  body('sort_order').optional().isInt(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    // Check if banner exists
    const banner = await Banner.findByPk(id);
    if (!banner) {
      // Clean up uploaded file if banner not found
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({ message: 'Banner not found' });
    }

    const updateData = { ...req.body };

    // Parse sort_order properly - handle string "1" or number 1
    if (updateData.sort_order !== undefined && updateData.sort_order !== null && updateData.sort_order !== '') {
      const parsed = parseInt(updateData.sort_order);
      updateData.sort_order = isNaN(parsed) ? banner.sort_order : parsed; // Keep existing if invalid
    }

    // Handle is_active properly - convert string "true"/"false" to boolean
    if (updateData.is_active !== undefined) {
      updateData.is_active = updateData.is_active === true || 
                             updateData.is_active === 'true' || 
                             updateData.is_active === 1 ||
                             updateData.is_active === '1';
    }

    // If a new image was uploaded, use it; otherwise keep existing image
    if (req.file) {
      // Delete old image file if it was uploaded (not an external URL)
      if (banner.image && banner.image.startsWith('/uploads/banners/')) {
        const oldFilePath = path.join(__dirname, '..', banner.image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      updateData.image = `/uploads/banners/${req.file.filename}`;
      // Also update mobile_image if it wasn't explicitly provided
      if (!req.body.mobile_image) {
        updateData.mobile_image = updateData.image;
      }
    }

    await banner.update(updateData);
    
    console.log(`Updated banner: ${banner.title}`);
    console.log(`Updated banner details:`, {
      id: banner.id,
      title: banner.title,
      sort_order: banner.sort_order,
      is_active: banner.is_active
    });
    res.json(banner);
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.error('Error updating banner:', error);
    res.status(500).json({ message: 'Error updating banner', error: error.message });
  }
});

// Delete banner (admin only) - also delete associated image files
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Delete associated image files if they were uploaded (not external URLs)
    if (banner.image && banner.image.startsWith('/uploads/banners/')) {
      const imagePath = path.join(__dirname, '..', banner.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (banner.mobile_image && banner.mobile_image.startsWith('/uploads/banners/')) {
      const mobileImagePath = path.join(__dirname, '..', banner.mobile_image);
      if (fs.existsSync(mobileImagePath)) {
        fs.unlinkSync(mobileImagePath);
      }
    }

    await banner.destroy();
    
    console.log(`Deleted banner: ${banner.title}`);
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ message: 'Error deleting banner', error: error.message });
  }
});

// Toggle banner active status (admin only)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await banner.update({ is_active: !banner.is_active });
    
    console.log(`Toggled banner status: ${banner.title} - ${banner.is_active ? 'Active' : 'Inactive'}`);
    res.json(banner);
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({ message: 'Error toggling banner status' });
  }
});

module.exports = router;
