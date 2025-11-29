const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/partners';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and document files are allowed'));
    }
  }
});

// Create partners table if it doesn't exist
const createPartnersTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS partners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        business VARCHAR(255) NOT NULL,
        partnership_type ENUM('franchise', 'agency', 'reseller') NOT NULL,
        experience TEXT,
        documents VARCHAR(500),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await db.query(createTableQuery);
    console.log('Partners table created or already exists');
  } catch (error) {
    console.error('Error creating partners table:', error);
  }
};

// Initialize table
// createPartnersTable();

// Apply for partnership
router.post('/apply', upload.single('documents'), async (req, res) => {
  try {
    const { name, email, phone, business, partnershipType, experience } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !business || !partnershipType) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Check if email already exists
    const [existingPartner] = await db.query(
      'SELECT id FROM partners WHERE email = ?',
      [email]
    );

    if (existingPartner.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An application with this email already exists'
      });
    }

    // Handle file upload
    let documentPath = null;
    if (req.file) {
      documentPath = req.file.path;
    }

    // Insert partner application
    const [result] = await db.query(
      `INSERT INTO partners (name, email, phone, business, partnership_type, experience, documents, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [name, email, phone, business, partnershipType, experience, documentPath]
    );

    res.status(201).json({
      success: true,
      message: 'Partnership application submitted successfully',
      applicationId: result.insertId
    });

  } catch (error) {
    console.error('Error submitting partnership application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Get all partner applications (admin only)
router.get('/applications', async (req, res) => {
  try {
    const applications = await db.query(
      `SELECT id, name, email, phone, business, partnership_type, experience, 
              documents, status, created_at, updated_at 
       FROM partners 
       ORDER BY created_at DESC`
    );

    // Ensure we return an array
    const appsArray = Array.isArray(applications) ? applications : (applications ? [applications] : []);

    res.json({
      success: true,
      applications: appsArray
    });

  } catch (error) {
    console.error('Error fetching partner applications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single partner application (admin only)
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const applications = await db.query(
      `SELECT id, name, email, phone, business, partnership_type, experience, 
              documents, status, created_at, updated_at 
       FROM partners 
       WHERE id = ?`,
      [id]
    );

    // Handle both array and object results
    const appsArray = Array.isArray(applications) ? applications : (applications ? [applications] : []);

    if (appsArray.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application: appsArray[0]
    });

  } catch (error) {
    console.error('Error fetching partner application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update partner application status (admin only)
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const result = await db.query(
      'UPDATE partners SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // Check affectedRows - handle both array and object results
    const affectedRows = Array.isArray(result) 
      ? (result[0]?.affectedRows || result.affectedRows) 
      : (result.affectedRows || result[0]?.affectedRows || 0);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully'
    });

  } catch (error) {
    console.error('Error updating partner application status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete partner application (admin only)
router.delete('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get application details to delete associated file
    const [applications] = await db.query(
      'SELECT documents FROM partners WHERE id = ?',
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Delete associated file if exists
    if (applications[0].documents && fs.existsSync(applications[0].documents)) {
      fs.unlinkSync(applications[0].documents);
    }

    // Delete application from database
    const [result] = await db.query(
      'DELETE FROM partners WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting partner application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get partner statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN partnership_type = 'franchise' THEN 1 ELSE 0 END) as franchise,
        SUM(CASE WHEN partnership_type = 'agency' THEN 1 ELSE 0 END) as agency,
        SUM(CASE WHEN partnership_type = 'reseller' THEN 1 ELSE 0 END) as reseller
       FROM partners`
    );

    // Handle both array and object results
    const statsData = Array.isArray(stats) ? (stats[0] || stats) : stats;

    res.json({
      success: true,
      stats: statsData
    });

  } catch (error) {
    console.error('Error fetching partner statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new partner (admin only)
router.post('/admin/create', upload.single('documents'), async (req, res) => {
  try {
    console.log('=== CREATE PARTNER REQUEST ===');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.filename : 'No file');
    
    const { name, email, phone, business, partnershipType, experience, status } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !business || !partnershipType) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      console.log('Validation failed: Invalid phone format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Check if email already exists
    console.log('Checking for existing partner with email:', email);
    const existingPartner = await db.query(
      'SELECT id FROM partners WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingPartner) && existingPartner.length > 0) {
      console.log('Partner with email already exists');
      return res.status(400).json({
        success: false,
        message: 'A partner with this email already exists'
      });
    }

    // Handle file upload
    let documentPath = null;
    if (req.file) {
      documentPath = req.file.path.replace(/\\/g, '/'); // Normalize path separators
      console.log('Document uploaded:', documentPath);
    }

    // Insert partner
    console.log('Inserting partner into database...');
    const result = await db.query(
      `INSERT INTO partners (name, email, phone, business, partnership_type, experience, documents, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, business, partnershipType, experience || null, documentPath, status || 'approved']
    );

    console.log('Insert result:', result);
    
    // Get the insertId - handle both array and object results
    const insertId = Array.isArray(result) ? (result[0]?.insertId || result.insertId) : (result.insertId || result[0]?.insertId);
    
    if (!insertId) {
      console.error('No insertId returned from insert query');
      throw new Error('Failed to create partner: No insert ID returned');
    }

    console.log('Partner created with ID:', insertId);

    // Fetch the created partner
    const newPartner = await db.query(
      `SELECT id, name, email, phone, business, partnership_type, experience, 
              documents, status, created_at, updated_at 
       FROM partners 
       WHERE id = ?`,
      [insertId]
    );

    const partner = Array.isArray(newPartner) ? newPartner[0] : newPartner;

    console.log('Partner fetched:', partner);

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      partner: partner
    });

  } catch (error) {
    console.error('Error creating partner:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update an existing partner (admin only)
router.put('/admin/:id', upload.single('documents'), async (req, res) => {
  try {
    console.log('=== UPDATE PARTNER REQUEST ===');
    console.log('Partner ID:', req.params.id);
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.filename : 'No file');
    
    const { id } = req.params;
    const { name, email, phone, business, partnershipType, experience, status } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !business || !partnershipType) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      console.log('Validation failed: Invalid phone format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Check if email already exists for another partner
    const existingPartner = await db.query(
      'SELECT id FROM partners WHERE email = ? AND id != ?',
      [email, id]
    );

    if (Array.isArray(existingPartner) && existingPartner.length > 0) {
      console.log('Partner with email already exists');
      return res.status(400).json({
        success: false,
        message: 'A partner with this email already exists'
      });
    }

    // Handle file upload
    let documentPath = null;
    if (req.file) {
      documentPath = req.file.path.replace(/\\/g, '/'); // Normalize path separators
      console.log('Document uploaded:', documentPath);
    }

    // Update partner
    console.log('Updating partner in database...');
    const result = await db.query(
      `UPDATE partners SET name = ?, email = ?, phone = ?, business = ?, 
                          partnership_type = ?, experience = ?, status = ?,
                          updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, email, phone, business, partnershipType, experience || null, status, id]
    );

    // Check affectedRows - handle both array and object results
    const affectedRows = Array.isArray(result) 
      ? (result[0]?.affectedRows || result.affectedRows) 
      : (result.affectedRows || result[0]?.affectedRows || 0);

    if (affectedRows === 0) {
      console.log('No partner found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // If a new document was uploaded, update the document path
    if (documentPath) {
      await db.query(
        'UPDATE partners SET documents = ? WHERE id = ?',
        [documentPath, id]
      );
    }

    // Fetch the updated partner
    const updatedPartner = await db.query(
      `SELECT id, name, email, phone, business, partnership_type, experience, 
              documents, status, created_at, updated_at 
       FROM partners 
       WHERE id = ?`,
      [id]
    );

    const partner = Array.isArray(updatedPartner) ? updatedPartner[0] : updatedPartner;

    console.log('Partner updated successfully');

    res.json({
      success: true,
      message: 'Partner updated successfully',
      partner: partner
    });

  } catch (error) {
    console.error('Error updating partner:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;