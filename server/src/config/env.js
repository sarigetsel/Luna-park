require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/luna-park',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  fullDayPrice: Number(process.env.FULL_DAY_PRICE) || 50,
  hourlyRate: Number(process.env.HOURLY_RATE) || 15,
};
