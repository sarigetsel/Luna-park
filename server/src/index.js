const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { port, nodeEnv } = require('./config/env');
const { requestLogger, errorLogger } = require('./middleware/logger');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(requestLogger);
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'luna-park-api' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorLogger);
app.use((err, _req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

async function start() {
  await connectDB();
  app.listen(port, () => {
    console.log(`Luna-park API running on port ${port} (${nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
