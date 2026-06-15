const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Session = require('../models/Session');
const razorpayService = require('../services/razorpay');
const receiptService = require('../services/receipt');
const whatsapp = require('../services/whatsapp');

/**
 * Handle Razorpay payment webhook
 */
async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    if (!razorpayService.verifyWebhookSignature(req.body, signature)) {
      console.error('[Payment] Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Payment] Webhook received: ${event}`);

    if (event === 'payment_link.paid') {
      const paymentLinkEntity = payload.payment_link?.entity;
      const paymentEntity = payload.payment?.entity;

      if (!paymentLinkEntity) {
        return res.status(200).json({ status: 'ignored' });
      }

      const orderId = paymentLinkEntity.notes?.order_id;
      const customerPhone = paymentLinkEntity.notes?.customer_phone;

      if (!orderId) {
        console.error('[Payment] No order_id in payment link notes');
        return res.status(200).json({ status: 'no order_id' });
      }

      // Find and update order
      const order = await Order.findOne({ orderId });
      if (!order) {
        console.error(`[Payment] Order not found: ${orderId}`);
        return res.status(200).json({ status: 'order not found' });
      }

      // Update order with payment details
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      order.razorpayPaymentId = paymentEntity?.id || '';
      order.razorpayPaymentLinkId = paymentLinkEntity.id;

      // Detect payment method
      if (paymentEntity?.method) {
        order.paymentMethod = paymentEntity.method; // 'upi', 'card', 'netbanking', 'wallet'
      }

      await order.save();

      // Update customer stats
      await Customer.findOneAndUpdate(
        { phone: order.customerPhone },
        {
          $inc: { totalOrders: 1, totalSpent: order.totalAmount },
          lastOrderDate: new Date(),
        }
      );

      // Send receipt via WhatsApp
      await receiptService.sendReceipt(order);
      order.receiptSent = true;
      await order.save();

      // Update session to done
      await Session.findOneAndUpdate(
        { customerPhone: order.customerPhone },
        { stage: 'done' }
      );

      console.log(`[Payment] Order ${orderId} paid successfully`);
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const notes = paymentEntity?.notes;

      if (notes?.order_id) {
        await Order.findOneAndUpdate(
          { orderId: notes.order_id },
          { paymentStatus: 'failed' }
        );

        // Notify customer
        if (notes.customer_phone) {
          await whatsapp.sendTextMessage(
            notes.customer_phone,
            'Payment fail ho gaya 😔\nKripya dobara try karein ya "HI" bhejein naya order karne ke liye.'
          );
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Payment] Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Get payment history
 */
async function getPayments(req, res) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('orderId customerName customerPhone totalAmount paymentStatus paymentMethod paidAt createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      payments: orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

/**
 * Get revenue stats for dashboard charts
 */
async function getPaymentStats(req, res) {
  try {
    const { period = 'daily' } = req.query;

    let dateFormat, daysBack;
    if (period === 'daily') {
      daysBack = 30;
      dateFormat = '%Y-%m-%d';
    } else if (period === 'weekly') {
      daysBack = 90;
      dateFormat = '%Y-W%V';
    } else {
      daysBack = 365;
      dateFormat = '%Y-%m';
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const stats = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paidAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$paidAt', timezone: 'Asia/Kolkata' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Overall totals
    const totals = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    res.json({
      chartData: stats.map(s => ({
        date: s._id,
        revenue: s.revenue,
        orders: s.orders,
      })),
      totals: totals[0] || { totalRevenue: 0, totalOrders: 0 },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment stats' });
  }
}

module.exports = {
  handleRazorpayWebhook,
  getPayments,
  getPaymentStats,
};
