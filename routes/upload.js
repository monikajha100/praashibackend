const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { devBypassAdmin } = require('../middleware/auth');

// Helper function to generate full URL for uploaded files
const generateFileUrl = (filePath) => {
  // In development, return relative path so frontend can handle the base URL
  if (process.env.NODE_ENV !== 'production') {
    return filePath;
  }
  // In production, return full URL
  return `https://api.praashibysupal.com${filePath}`;
};

// Create uploads directories if they don't exist
const bannersDir = path.join(__dirname, '..', 'uploads', 'banners');
const productsDir = path.join(__dirname, '..', 'uploads', 'products');
const videosDir = path.join(__dirname, '..', 'uploads', 'videos');
const imagesDir = path.join(__dirname, '..', 'uploads', 'images');

if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Configure multer for different upload types
const createStorage = (directory) => multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directory);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const createUpload = (directory, fileFilter, maxSize = 5 * 1024 * 1024) => multer({
  storage: createStorage(directory),
  limits: {
    fileSize: maxSize
  },
  fileFilter: fileFilter
});

// Image upload for banners (5MB limit)
const uploadBanner = createUpload(bannersDir, function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed!'), false);
  }
  cb(null, true);
}, 5 * 1024 * 1024); // 5MB

// Image upload for products (5MB limit)
const uploadProduct = createUpload(productsDir, function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed!'), false);
  }
  cb(null, true);
}, 5 * 1024 * 1024); // 5MB

// Video upload (50MB limit)
const uploadVideo = createUpload(videosDir, function (req, file, cb) {
  if (!file.originalname.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i)) {
    return cb(new Error('Only video files (MP4, WebM, MOV, AVI, MKV, FLV, WMV, M4V) are allowed!'), false);
  }
  cb(null, true);
}, 50 * 1024 * 1024); // 50MB

// General image upload (5MB limit)
const uploadImage = createUpload(imagesDir, function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed!'), false);
  }
  cb(null, true);
}, 5 * 1024 * 1024); // 5MB

// Upload banner image
router.post('/banner', uploadBanner.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = `/uploads/banners/${req.file.filename}`;
    const fileUrl = generateFileUrl(filePath);
    
    res.json({
      message: 'Banner uploaded successfully',
      url: fileUrl,
      path: filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Upload product image
router.post('/product', uploadProduct.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = `/uploads/products/${req.file.filename}`;
    const fileUrl = generateFileUrl(filePath);
    
    res.json({
      message: 'Product image uploaded successfully',
      url: fileUrl,
      path: filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Upload general image
router.post('/image', uploadImage.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = `/uploads/images/${req.file.filename}`;
    const fileUrl = generateFileUrl(filePath);
    
    res.json({
      message: 'Image uploaded successfully',
      url: fileUrl,
      path: filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Upload video
router.post('/video', uploadVideo.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const filePath = `/uploads/videos/${req.file.filename}`;
    const fileUrl = generateFileUrl(filePath);
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    
    res.json({
      message: 'Video uploaded successfully',
      url: fileUrl,
      path: filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      sizeMB: fileSizeMB,
      mimetype: req.file.mimetype,
      maxSizeAllowed: '50MB'
    });
  } catch (error) {
    console.error('Video upload error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'Video file too large. Maximum size allowed is 50MB',
        maxSize: '50MB'
      });
    }
    res.status(500).json({ message: 'Error uploading video file', error: error.message });
  }
});

// Delete banner image
router.delete('/banner/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(bannersDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Banner deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

// Delete product image
router.delete('/product/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(productsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Product image deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

// Delete video
router.delete('/video/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(videosDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Video deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

// Delete general image
router.delete('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(imagesDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

// Get upload limits and supported formats
router.get('/limits', (req, res) => {
  res.json({
    limits: {
      images: {
        maxSize: '5MB',
        maxSizeBytes: 5 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      },
      videos: {
        maxSize: '50MB',
        maxSizeBytes: 50 * 1024 * 1024,
        allowedFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v']
      }
    },
    endpoints: {
      bannerImage: 'POST /api/upload/banner',
      productImage: 'POST /api/upload/product',
      generalImage: 'POST /api/upload/image',
      video: 'POST /api/upload/video'
    },
    baseUrl: generateFileUrl('')
  });
});

module.exports = router;
