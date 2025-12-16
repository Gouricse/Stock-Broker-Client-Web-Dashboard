const User = require('../models/User');

// Supported stocks list (per requirements)
const SUPPORTED_STOCKS = ['AAPL', 'GOOG', 'TSLA', 'AMZN', 'META', 'NVDA', 'MSFT'];

// @desc    Get all supported stocks
// @route   GET /api/stocks
// @access  Private
exports.getSupportedStocks = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: SUPPORTED_STOCKS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's subscribed stocks
// @route   GET /api/stocks/subscribed
// @access  Private
exports.getSubscribedStocks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user.subscribedStocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Subscribe to a stock
// @route   POST /api/stocks/subscribe
// @access  Private
exports.subscribeStock = async (req, res) => {
  try {
    const { ticker } = req.body;
    const normalizedTicker = String(ticker || '').trim().toUpperCase();

    // Validate ticker
    if (!normalizedTicker || !SUPPORTED_STOCKS.includes(normalizedTicker)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stock ticker. Supported: ${SUPPORTED_STOCKS.join(', ')}`
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already subscribed
    if (user.subscribedStocks.includes(normalizedTicker)) {
      return res.status(400).json({
        success: false,
        message: `Already subscribed to ${normalizedTicker}`
      });
    }

    // Add stock to subscriptions
    user.subscribedStocks.push(normalizedTicker);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully subscribed to ${normalizedTicker}`,
      data: user.subscribedStocks
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unsubscribe from a stock
// @route   POST /api/stocks/unsubscribe
// @access  Private
exports.unsubscribeStock = async (req, res) => {
  try {
    const { ticker } = req.body;
    const normalizedTicker = String(ticker || '').trim().toUpperCase();

    // Validate ticker
    if (!normalizedTicker || !SUPPORTED_STOCKS.includes(normalizedTicker)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stock ticker. Supported: ${SUPPORTED_STOCKS.join(', ')}`
      });
    }

    const user = await User.findById(req.user.id);

    // Check if subscribed
    if (!user.subscribedStocks.includes(normalizedTicker)) {
      return res.status(400).json({
        success: false,
        message: `Not subscribed to ${normalizedTicker}`
      });
    }

    // Remove stock from subscriptions
    user.subscribedStocks = user.subscribedStocks.filter(s => s !== normalizedTicker);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully unsubscribed from ${normalizedTicker}`,
      data: user.subscribedStocks
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
