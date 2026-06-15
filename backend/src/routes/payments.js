const express = require('express');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/payments/webhook — Razorpay webhook (NO auth — Razorpay sends this)
 */
router.post('/webhook', paymentController.handleRazorpayWebhook);

/**
 * GET /api/payments — Payment history (requires auth)
 */
router.get('/', authMiddleware, paymentController.getPayments);

/**
 * GET /api/payments/stats — Revenue stats (requires auth)
 */
router.get('/stats', authMiddleware, paymentController.getPaymentStats);

module.exports = router;
