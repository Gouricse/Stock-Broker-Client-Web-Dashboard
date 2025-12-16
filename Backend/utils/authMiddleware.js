const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      if (!JWT_SECRET) {
        console.error('JWT_SECRET not configured');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }
      
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check token type (should be access token)
      if (decoded.type && decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      // Get user from token
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check if password was changed after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'Password recently changed. Please login again.',
          code: 'PASSWORD_CHANGED'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid',
        code: 'TOKEN_ERROR'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in auth middleware'
    });
  }
};

// Optional auth - doesn't fail if no token, but adds user if valid token exists
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but we don't fail - just continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { protect, optionalAuth };
