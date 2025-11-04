const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check for a valid token (unchanged)
const authMiddleware = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.user.id).select('-password');
      
      if (!req.user) {
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      next(); // Move to the next function
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check if user is a verified landlord (unchanged)
const isLandlord = (req, res, next) => {
  if (req.user && req.user.role === 'landlord' && req.user.isVerified) {
    next();
  } else {
    if (!req.user) {
        return res.status(401).json({ message: 'Authorization error, user data missing.' });
    }
    if (req.user.role !== 'landlord') {
        return res.status(403).json({ message: 'Access denied. Landlord account required.' });
    }
    if (!req.user.isVerified) {
         return res.status(403).json({ message: 'Access denied. Landlord account is not verified.' });
    }
  }
};

// Middleware to check if user is an Admin (unchanged)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// --- NEW: Middleware to check if user is a Landlord OR Admin ---
const isLandlordOrAdmin = (req, res, next) => {
  if (req.user && req.user.isVerified && (req.user.role === 'landlord' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Landlord or Admin account required.' });
  }
};
// --- END NEW ---


module.exports = { authMiddleware, isLandlord, isAdmin, isLandlordOrAdmin }; // Export all four