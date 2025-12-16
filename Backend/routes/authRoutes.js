const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  emailLogin,
  logout,
  getMe, 
  refreshToken, 
  changePassword,
  verifyToken 
} = require('../controllers/authController');
const { protect } = require('../utils/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/email-login', emailLogin);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);
router.get('/verify', protect, verifyToken);

module.exports = router;
