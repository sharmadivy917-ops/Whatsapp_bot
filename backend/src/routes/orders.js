const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

/**
 * GET /api/orders — Get all orders with filters
 */
router.get('/', orderController.getOrders);

/**
 * GET /api/orders/export — Export orders to Excel
 */
router.get('/export', orderController.exportOrders);

/**
 * GET /api/orders/:id — Get single order
 */
router.get('/:id', orderController.getOrderById);

/**
 * PATCH /api/orders/:id/deliver — Mark as delivered
 */
router.patch('/:id/deliver', orderController.markDelivered);

/**
 * PATCH /api/orders/:id/payment — Update payment status (paid/rejected)
 */
router.patch('/:id/payment', orderController.updatePaymentStatus);

/**
 * GET /api/orders/:id/screenshot — Get the screenshot media binary
 */
router.get('/:id/screenshot', orderController.getScreenshot);

module.exports = router;
