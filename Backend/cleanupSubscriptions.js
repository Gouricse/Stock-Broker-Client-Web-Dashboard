const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const SUPPORTED_STOCKS = ['AAPL', 'GOOG', 'TSLA', 'AMZN', 'META', 'NVDA', 'MSFT'];

const cleanupSubscriptions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for cleanup...');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      const oldSubscriptions = user.subscribedStocks;
      const validSubscriptions = oldSubscriptions.filter(ticker => 
        SUPPORTED_STOCKS.includes(ticker)
      );

      if (oldSubscriptions.length !== validSubscriptions.length) {
        console.log(`Cleaning up user ${user.email}:`);
        console.log(`  Old: ${oldSubscriptions.join(', ')}`);
        console.log(`  New: ${validSubscriptions.join(', ')}`);
        
        user.subscribedStocks = validSubscriptions;
        await user.save();
      }
    }

    console.log('Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
};

cleanupSubscriptions();
