const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const db = require('../config/database');
const nodemailer = require('nodemailer');
const { Contact } = require('../models');
const { devBypass, devBypassAdmin } = require('../middleware/auth');

// Submit contact form
router.post('/', [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('name').optional().trim(),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('phone').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { name, email, phone, subject, message, firstName, lastName } = req.body;
    
    // Handle firstName + lastName format from frontend
    if (!name && (firstName || lastName)) {
      name = `${firstName || ''} ${lastName || ''}`.trim();
    }
    
    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    // Get IP address
    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    // Save to database using Sequelize
    const contact = await Contact.create({
      name,
      email,
      phone: phone || null,
      subject: subject || 'General Inquiry',
      message,
      ip_address,
      user_agent,
      status: 'new',
      priority: 'normal'
    });

    // Send email notification (if configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.CONTACT_EMAIL || 'hello@praashibysupal.com',
          subject: `New Contact Form Submission: ${subject || 'General Inquiry'}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({ message: 'Thank you for your message. We will get back to you soon!' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Error submitting contact form' });
  }
});

// Subscribe to newsletter
router.post('/newsletter', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if already subscribed
    const existing = await db.query('SELECT id FROM newsletter_subscribers WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email is already subscribed to our newsletter' });
    }

    // Add to newsletter
    await db.query(
      'INSERT INTO newsletter_subscribers (email) VALUES (?)',
      [email]
    );

    res.json({ message: 'Successfully subscribed to our newsletter!' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ message: 'Error subscribing to newsletter' });
  }
});

// Get contact messages (admin only)
router.get('/admin/messages', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: messages } = await Contact.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      messages,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Error fetching contact messages' });
  }
});

// Get contact statistics (admin only)
router.get('/admin/statistics', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const stats = await Contact.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Get single contact message (admin only)
router.get('/admin/messages/:id', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ message: 'Error fetching contact message' });
  }
});

// Mark message as read (admin only)
router.put('/admin/messages/:id/read', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }
    
    await contact.markAsRead();
    res.json({ message: 'Message marked as read', contact });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Error updating message status' });
  }
});

// Update message status (admin only)
router.put('/admin/messages/:id/status', devBypass, devBypassAdmin, [
  body('status').isIn(['new', 'read', 'responded', 'archived']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const contact = await Contact.findByPk(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }
    
    contact.status = req.body.status;
    if (req.body.status === 'read' || req.body.status === 'responded') {
      contact.is_read = true;
    }
    if (req.body.status === 'responded' && !contact.responded_at) {
      contact.responded_at = new Date();
    }
    
    await contact.save();
    res.json({ message: 'Status updated successfully', contact });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
});

// Update priority (admin only)
router.put('/admin/messages/:id/priority', devBypass, devBypassAdmin, [
  body('priority').isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const contact = await Contact.findByPk(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }
    
    contact.priority = req.body.priority;
    await contact.save();
    
    res.json({ message: 'Priority updated successfully', contact });
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ message: 'Error updating priority' });
  }
});

// Add response notes (admin only)
router.put('/admin/messages/:id/notes', devBypass, devBypassAdmin, [
  body('notes').trim().notEmpty().withMessage('Notes cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const contact = await Contact.findByPk(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }
    
    await contact.markAsResponded(req.body.notes);
    res.json({ message: 'Response notes added successfully', contact });
  } catch (error) {
    console.error('Error adding notes:', error);
    res.status(500).json({ message: 'Error adding notes' });
  }
});

// Delete message (admin only)
router.delete('/admin/messages/:id', devBypass, devBypassAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }
    
    await contact.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

module.exports = router;
