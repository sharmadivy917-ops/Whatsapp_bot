require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const path = require('path');

// Import routes
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const vegetableRoutes = require('./routes/vegetables');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');

// Import cron jobs
const { setupCronJobs } = require('./jobs/cron');

// Import models (to ensure they're registered)
require('./models/Counter');
require('./models/Vegetable');
require('./models/Order');
require('./models/Customer');
require('./models/Session');
require('./models/Settings');

const app = express();
const PORT = process.env.PORT || 5000;

// === MIDDLEWARE ===

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — allow frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Logging
app.use(morgan('dev'));

// Body parser — need raw body for Razorpay webhook verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === ROUTES ===

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'VegBot API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// WhatsApp webhook (no /api prefix — Meta expects /webhook)
app.use('/webhook', webhookRoutes);

// Auth
app.use('/api/auth', authRoutes);

// Protected API routes
app.use('/api/vegetables', vegetableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Static frontend serving (Production)
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // 404 handler for API routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// === DATABASE CONNECTION + SERVER START ===

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vegbot';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    // Ensure default settings exist
    const Settings = require('./models/Settings');
    await Settings.getSettings();
    console.log('✅ Settings initialized');

    // Start cron jobs
    setupCronJobs(cron);

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 VegBot server running on port ${PORT}`);
      console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`🔑 Admin login: POST /api/auth/login`);
      if (process.env.TEST_MODE === 'true') {
        console.log(`🧪 TEST MODE ON — WhatsApp messages will be logged to console`);
      }
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('Make sure MongoDB is running on localhost:27017');
    process.exit(1);
  });

module.exports = app;
