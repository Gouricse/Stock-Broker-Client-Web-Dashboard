const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Secret - ensure it exists
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set!');
}

// Generate Access Token (short-lived)
const generateAccessToken = (userId) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id: userId, type: 'access' }, JWT_SECRET, {
    expiresIn: '15m' // 15 minutes
  });
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (userId) => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id: userId, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: '7d' // 7 days
  });
};

// Set secure cookie options
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // 'none' required for cross-origin
  maxAge
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password +refreshToken +refreshTokenExpiry');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is locked due to too many failed attempts. Try again in ${lockTimeRemaining} minutes.`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token hash in database
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    
    user.refreshToken = refreshTokenHash;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save({ validateBeforeSave: false });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken: rememberMe ? refreshToken : undefined, // Only send in response if rememberMe
        expiresIn: 15 * 60 * 1000, // 15 minutes in ms
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          subscribedStocks: user.subscribedStocks,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Login user with email only (creates user if missing)
// @route   POST /api/auth/email-login
// @access  Public
exports.emailLogin = async (req, res) => {
  try {
    const { email, rememberMe } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail }).select('+refreshToken +refreshTokenExpiry');

    // Auto-create user for demo purposes (assignment requirement)
    if (!user) {
      const nameFromEmail = normalizedEmail.split('@')[0] || 'User';
      const randomPassword = crypto.randomBytes(12).toString('hex');
      user = await User.create({
        name: nameFromEmail.length >= 2 ? nameFromEmail : 'User',
        email: normalizedEmail,
        password: randomPassword
      });

      // reload with refreshToken fields selectable
      user = await User.findById(user._id).select('+refreshToken +refreshTokenExpiry');
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token hash in database
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    user.refreshToken = refreshTokenHash;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken: rememberMe ? refreshToken : undefined,
        expiresIn: 15 * 60 * 1000,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          subscribedStocks: user.subscribedStocks,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during email login'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (with refresh token)
exports.refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Hash the provided token and find user
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshTokenHash,
      refreshTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token or token expired'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    // Optionally rotate refresh token for added security
    const newRefreshToken = generateRefreshToken(user._id);
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    user.refreshToken = newRefreshTokenHash;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60 * 1000
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Clear refresh token from database
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $unset: { refreshToken: 1, refreshTokenExpiry: 1 }
      });
    }

    // Clear refresh token cookie
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscribedStocks: user.subscribedStocks,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens by clearing it
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { refreshToken: 1, refreshTokenExpiry: 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify token validity
// @route   GET /api/auth/verify
// @access  Private
exports.verifyToken = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
