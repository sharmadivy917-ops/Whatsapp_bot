const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Vegetable = require('../models/Vegetable');
const Settings = require('../models/Settings');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/dashboard/stats — Today's stats for dashboard home
 */
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenue,
      totalCustomers,
      pendingDeliveries,
      recentOrders,
    ] = await Promise.all([
      // Today's order count
      Order.countDocuments({ createdAt: { $gte: today } }),

      // Today's revenue (paid orders only)
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Total unique customers
      Customer.countDocuments(),

      // Pending deliveries
      Order.countDocuments({ deliveryStatus: 'processing', paymentStatus: 'paid' }),

      // Last 10 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderId customerName items totalAmount paymentStatus deliveryStatus createdAt screenshotMediaId'),
    ]);

    res.json({
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalCustomers,
      pendingDeliveries,
      recentOrders,
    });
  } catch (error) {
    console.error('[Dashboard] Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/dashboard/settings — Get shop settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    // Don't send sensitive API keys to frontend (mask them)
    const safeSettings = settings.toObject();
    if (safeSettings.razorpayKeySecret) {
      safeSettings.razorpayKeySecret = '••••••••' + safeSettings.razorpayKeySecret.slice(-4);
    }
    if (safeSettings.metaAccessToken) {
      safeSettings.metaAccessToken = '••••••••' + safeSettings.metaAccessToken.slice(-4);
    }
    res.json(safeSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/dashboard/settings — Update shop settings
 */
router.put('/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const updates = req.body;

    // Update allowed fields
    const allowedFields = [
      'shopName', 'ownerName', 'shopLocation', 'isShopOpen',
      'shopTimings', 'welcomeMessage', 'closedMessage', 'manualClosedMessage',
      'ownerPhone', 'ownerUPIId', 'razorpayKeyId', 'razorpayKeySecret',
      'metaAccessToken', 'metaPhoneNumberId', 'metaWebhookVerifyToken',
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        // Don't overwrite secrets with masked values
        if (field === 'razorpayKeySecret' && updates[field].startsWith('••••')) return;
        if (field === 'metaAccessToken' && updates[field].startsWith('••••')) return;
        settings[field] = updates[field];
      }
    });

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * PATCH /api/dashboard/toggle-shop — Quick toggle shop open/closed
 */
router.patch('/toggle-shop', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    settings.isShopOpen = !settings.isShopOpen;
    await settings.save();
    res.json({ isShopOpen: settings.isShopOpen });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle shop' });
  }
});

module.exports = router;
