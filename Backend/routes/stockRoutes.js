const express = require('express');
const router = express.Router();
const { 
  getSupportedStocks, 
  getSubscribedStocks, 
  subscribeStock, 
  unsubscribeStock 
} = require('../controllers/stockController');
const { protect } = require('../utils/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/', getSupportedStocks);
router.get('/subscribed', getSubscribedStocks);
router.post('/subscribe', subscribeStock);
router.post('/unsubscribe', unsubscribeStock);

module.exports = router;
