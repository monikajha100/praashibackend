const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  // Development bypass: skip auth entirely if enabled
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_ALLOW_NONADMIN === 'true') {
    const emailFromEnv = (process.env.ADMIN_EMAIL || 'admin@local.dev').trim();
    req.user = {
      userId: 3, // Use a valid customer ID for testing
      email: emailFromEnv,
      role: 'admin'
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  // Get JWT secret from database or environment
  const getJWTSecret = async () => {
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }
    
    try {
      const settings = await db.query(`
        SELECT setting_value FROM company_settings WHERE setting_key = 'jwt_secret'
      `);
      
      if (settings.length > 0) {
        return settings[0].setting_value;
      }
      
      // Fallback secret
      return 'praashibysupal_jwt_secret_2025';
    } catch (error) {
      console.error('Error getting JWT secret:', error);
      return 'praashibysupal_jwt_secret_2025';
    }
  };
  
  getJWTSecret().then(jwtSecret => {
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        console.error('JWT verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      console.log('JWT verified successfully. User from token:', {
        userId: user.userId || user.id,
        email: user.email,
        role: user.role
      });
      req.user = user;
      next();
    });
  }).catch(error => {
    console.error('JWT verification error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  });
}

// Middleware to check admin role
async function requireAdmin(req, res, next) {
  // Development bypass: allow non-admins if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_ALLOW_NONADMIN === 'true') {
    return next();
  }

  // Log user info for debugging
  console.log('=== requireAdmin check ===');
  console.log('User:', req.user ? {
    userId: req.user.userId || req.user.id,
    email: req.user.email,
    role: req.user.role,
    roleType: typeof req.user.role
  } : 'No user object');

  if (!req.user) {
    console.log('❌ No user object found');
    return res.status(401).json({ message: 'Authentication required. Please login first.' });
  }

  // Check if user has admin role (case-insensitive)
  const userRole = (req.user.role || '').toString().toLowerCase().trim();
  const isAdminRole = userRole === 'admin';

  // Allow specific admin emails via env (comma-separated)
  const allowedAdminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  // Always allow admin@praashibysupal.com as a backup
  const defaultAdminEmails = ['admin@praashibysupal.com'];
  const allAllowedEmails = [...defaultAdminEmails, ...allowedAdminEmails].map(e => e.toLowerCase());
  const isAllowedEmail = req.user.email && allAllowedEmails.includes(req.user.email.toLowerCase());

  // If role check passes, allow access
  if (isAdminRole || isAllowedEmail) {
    console.log('✅ Admin access granted (role or email check passed)');
    return next();
  }

  // If role check fails, verify in database
  console.log('⚠️ Role check failed, checking database for user role...');
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      console.log('❌ No user ID found');
      return res.status(403).json({ 
        message: 'Admin access required. Please login with an admin account.',
        debug: process.env.NODE_ENV === 'development' ? {
          userRole: req.user.role,
          userId: userId,
          email: req.user.email
        } : undefined
      });
    }

    const users = await db.query('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    // Handle both array and single result formats
    const user = Array.isArray(users) ? (users.length > 0 ? users[0] : null) : users;
    
    if (user) {
      const dbRole = (user.role || '').toString().toLowerCase().trim();
      console.log(`Database role for user ${userId} (${user.email}): "${dbRole}" (raw: "${user.role}")`);
      
      if (dbRole === 'admin') {
        // Update req.user with correct role from database
        req.user.role = 'admin';
        console.log('✅ User has admin role in database, allowing access');
        return next();
      } else {
        console.log(`❌ User ${userId} (${user.email}) does not have admin role. Current role: "${dbRole}" (raw: "${user.role}")`);
        console.log(`   To fix: UPDATE users SET role = 'admin' WHERE id = ${userId};`);
      }
    } else {
      console.log(`❌ User ${userId} not found in database`);
    }
  } catch (error) {
    console.error('Error checking user role in database:', error);
    console.error('Error details:', error.message);
    // Don't block on database error, but log it
  }

  console.log('❌ Admin access denied');
  
  // Get user info from database for better error message
  let dbUserInfo = null;
  try {
    const userId = req.user.userId || req.user.id;
    if (userId) {
      const users = await db.query('SELECT id, email, role FROM users WHERE id = ?', [userId]);
      if (users && users.length > 0) {
        dbUserInfo = {
          id: users[0].id,
          email: users[0].email,
          role: users[0].role,
          roleType: typeof users[0].role
        };
      }
    }
  } catch (error) {
    // Ignore error, just use what we have
  }
  
  return res.status(403).json({ 
    message: 'Admin access required. Please login with an admin account.',
    debug: process.env.NODE_ENV === 'development' ? {
      tokenRole: req.user.role,
      tokenRoleType: typeof req.user.role,
      userId: req.user.userId || req.user.id,
      email: req.user.email,
      databaseUser: dbUserInfo,
      fixHint: dbUserInfo && dbUserInfo.role !== 'admin' 
        ? `Your account role is "${dbUserInfo.role || 'NULL'}" but needs to be "admin". Contact administrator to update your role.`
        : 'Please ensure your account has admin role in the database.'
    } : undefined
  });
}

// Optional authentication middleware
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
}

// Development bypass middleware (no auth required)
function devBypass(req, res, next) {
  // Development bypass: skip auth entirely if enabled OR in development mode
  if (process.env.NODE_ENV !== 'production') {
    // In development, allow bypass if explicitly enabled
    if (process.env.DEV_ALLOW_NONADMIN === 'true') {
      const emailFromEnv = (process.env.ADMIN_EMAIL || 'admin@local.dev').trim();
      req.user = {
        userId: 1,
        email: emailFromEnv,
        role: 'admin'
      };
      return next();
    }
    // Also allow bypass if no authorization header is provided
    if (!req.headers.authorization) {
      const emailFromEnv = (process.env.ADMIN_EMAIL || 'admin@local.dev').trim();
      req.user = {
        userId: 1,
        email: emailFromEnv,
        role: 'admin'
      };
      return next();
    }
  }
  return authenticateToken(req, res, next);
}

// Development bypass admin middleware
function devBypassAdmin(req, res, next) {
  // Development bypass: allow non-admins if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_ALLOW_NONADMIN === 'true') {
    return next();
  }
  return requireAdmin(req, res, next);
}

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  devBypass,
  devBypassAdmin
};
