const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Supported stocks (per requirements)
const SUPPORTED_STOCKS = ['AAPL', 'GOOG', 'TSLA', 'AMZN', 'META', 'NVDA', 'MSFT'];

// Base prices for calculating percentage change (simulating open price)
const basePrices = {
  AAPL: 193.42,
  GOOG: 191.41,
  TSLA: 389.22,
  AMZN: 180.50,
  META: 591.55,
  NVDA: 138.25,
  MSFT: 448.39,
};

// Current stock prices (shared across all users)
const stockPrices = {
  AAPL: 193.42,
  GOOG: 191.41,
  TSLA: 389.22,
  AMZN: 180.50,
  META: 591.55,
  NVDA: 138.25,
  MSFT: 448.39,
};

// Price history for charts (shared across all users)
const priceHistory = {};
SUPPORTED_STOCKS.forEach(ticker => {
  priceHistory[ticker] = [stockPrices[ticker]];
});

// Generate random price fluctuation (SAME for all users)
const generatePrice = (currentPrice) => {
  const change = (Math.random() - 0.5) * 4; // Random change between -2 and +2
  return Math.max(1, Number((currentPrice + change).toFixed(2)));
};

// Calculate percentage change from base price
const calculateChange = (ticker) => {
  const base = basePrices[ticker];
  const current = stockPrices[ticker];
  const change = ((current - base) / base) * 100;
  return Number(change.toFixed(2));
};

const getTickerRoom = (ticker) => `ticker:${ticker}`;

const getSocketTickerRooms = (socket) => {
  return Array.from(socket.rooms).filter((r) => typeof r === 'string' && r.startsWith('ticker:'));
};

const syncTickerRooms = (socket, subscribedTickers) => {
  const desired = new Set((subscribedTickers || []).map((t) => getTickerRoom(t)));
  const current = new Set(getSocketTickerRooms(socket));

  // leave rooms no longer desired
  current.forEach((room) => {
    if (!desired.has(room)) socket.leave(room);
  });

  // join newly desired
  desired.forEach((room) => {
    if (!current.has(room)) socket.join(room);
  });
};

// Get full stock data with price, change, and history
const getFullStockData = () => {
  const data = {};
  SUPPORTED_STOCKS.forEach(ticker => {
    data[ticker] = {
      price: stockPrices[ticker],
      change: calculateChange(ticker),
      history: priceHistory[ticker].slice(-20) // Last 20 data points for chart
    };
  });
  return data;
};

const getSubscribedPriceSnapshot = (subscribedTickers) => {
  const snapshot = {};
  (subscribedTickers || []).forEach((t) => {
    if (SUPPORTED_STOCKS.includes(t)) {
      snapshot[t] = {
        price: stockPrices[t],
        change: calculateChange(t),
        history: priceHistory[t].slice(-20)
      };
    }
  });
  return snapshot;
};

// Update all stock prices (called once, same for all users)
const updatePrices = () => {
  const timestamp = new Date().toISOString();
  
  SUPPORTED_STOCKS.forEach(ticker => {
    stockPrices[ticker] = generatePrice(stockPrices[ticker]);
    
    // Add to history (keep last 50 points)
    priceHistory[ticker].push(stockPrices[ticker]);
    if (priceHistory[ticker].length > 50) {
      priceHistory[ticker].shift();
    }
  });

  return {
    stocks: getFullStockData(),
    timestamp
  };
};

// Socket handler setup
const setupSocket = (io) => {
  // Authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.email} (Socket: ${socket.id})`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Send initial subscribed stocks + join ticker rooms
    const user = await User.findById(socket.userId);
    syncTickerRooms(socket, user.subscribedStocks);
    socket.emit('subscribed_stocks', user.subscribedStocks);
    
    // Send initial full stock data (same for all users)
    socket.emit('prices_snapshot', {
      stocks: getFullStockData(),
      timestamp: new Date().toISOString()
    });

    // Handle subscription updates from client
    socket.on('update_subscriptions', async () => {
      const updatedUser = await User.findById(socket.userId);
      syncTickerRooms(socket, updatedUser.subscribedStocks);
      socket.emit('subscribed_stocks', updatedUser.subscribedStocks);
      socket.emit('prices_snapshot', {
        stocks: getFullStockData(),
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  // Start price streaming - every 1 second (per requirements)
  // IMPORTANT: This runs ONCE and broadcasts SAME data to ALL users
  setInterval(() => {
    const priceData = updatePrices();
    
    // Emit ALL stock data to ALL connected users (synchronized)
    io.emit('all_prices_update', {
      stocks: priceData.stocks,
      timestamp: priceData.timestamp
    });
    
    // Also emit individual ticker updates to subscribed rooms
    SUPPORTED_STOCKS.forEach((ticker) => {
      io.to(getTickerRoom(ticker)).emit('price_update', {
        ticker,
        price: priceData.stocks[ticker].price,
        change: priceData.stocks[ticker].change,
        history: priceData.stocks[ticker].history,
        timestamp: priceData.timestamp
      });
    });
  }, 1000);
};

module.exports = { setupSocket };
