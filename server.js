const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

const envPaths = [
  path.join(__dirname, 'env.local'),
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.prod'),
  path.join(__dirname, '.env.production')
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

// Force development bypass for testing
if (process.env.NODE_ENV !== 'production') {
  process.env.DEV_ALLOW_NONADMIN = 'true';
  process.env.NODE_ENV = 'development';
}

const db = require('./config/database');
const {optionalAuth} = require('./middleware/auth')
const authRoutes = require('./routes/auth-sequelize');
const productRoutes = require('./routes/products-sequelize-simple');
const categoryRoutes = require('./routes/categories-sequelize-simple');
const subcategoryRoutes = require('./routes/subcategories-sequelize');
const orderRoutes = require('./routes/orders-sequelize');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const bannerRoutes = require('./routes/banners-sequelize');
const promotionalBannerRoutes = require('./routes/promotional-banners');
const uploadRoutes = require('./routes/upload');
const inventoryRoutes = require('./routes/inventory');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const partnerRoutes = require('./routes/partners');
const socialRoutes = require('./routes/social');
const instagramShopRoutes = require('./routes/instagram-shop');
const reportsRoutes = require('./routes/reports');
const specialOffersRoutes = require('./routes/special-offers');
const couponRoutes = require('./routes/coupons');
const storefrontRoutes = require('./routes/storefront');
const customersRoutes = require('./routes/customers');
const addressesRoutes = require('./routes/addresses');
const wishlistRoutes = require('./routes/wishlist');
const promotionalOffersRoutes = require('./routes/promotional-offers');
const cashbackRoutes = require('./routes/cashback');
const visitorRoutes = require('./routes/visitors');

const app = express();

// Security middleware - disabled for development
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}

// Rate limiting - disabled for development to avoid X-Forwarded-For issues
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    trustProxy: true, // Trust proxy for X-Forwarded-For header
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);
}

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://praashibysupal.com', 'https://www.praashibysupal.com','https://praashibackend-1.onrender.com']
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.NODE_ENV === 'production' 
    ? 'https://www.praashibysupal.com' 
    : 'http://localhost:3000');
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Content-Security-Policy", "img-src 'self' https://praashibackend-1.onrender.com https://api.praashibysupal.com http://localhost:3000 data:");
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection using Sequelize
const { sequelize } = require('./config/sequelize');

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });

app.use(optionalAuth)

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/admin/subcategories', subcategoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin/banners', bannerRoutes);
app.use('/api/promotional-banners', promotionalBannerRoutes);
app.use('/api/admin/promotional-banners', promotionalBannerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin/invoices', invoiceRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/admin/customers', customersRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/admin/partners', partnerRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin/social', socialRoutes);
app.use('/api/instagram-shop', instagramShopRoutes);
app.use('/api/admin/instagram-shop', instagramShopRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin/reports', reportsRoutes);
app.use('/api/special-offers', specialOffersRoutes);
app.use('/api/admin/special-offers', specialOffersRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cashback', cashbackRoutes);
app.use('/api/promotional-offers', promotionalOffersRoutes);
app.use('/api/admin/promotional-offers', promotionalOffersRoutes);
app.use('/api/visitors', visitorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Praashi by Supal API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware - Always return JSON
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  
  // Ensure we always send JSON response
  res.setHeader('Content-Type', 'application/json');
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Something went wrong!';
  
  res.status(statusCode).json({ 
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack,
      name: err.name
    } : undefined,
    timestamp: new Date().toISOString()
  });
});

// 404 handler - Always return JSON
app.use('*', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${process.env.DB_NAME || 'Not configured'}`);
  console.log(`⏰ Server started at: ${new Date().toISOString()}`);
});

module.exports = app;
