const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Vegetable = require('../models/Vegetable');
const ExcelJS = require('exceljs');

/**
 * Get all orders with filtering, search, and pagination
 */
async function getOrders(req, res) {
  try {
    const { filter, search, page = 1, limit = 50 } = req.query;

    const query = {};

    // Date filtering
    const now = new Date();
    if (filter === 'today') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfDay };
    } else if (filter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      query.createdAt = { $gte: startOfWeek };
    } else if (filter === 'month') {
      const startOfMonth = new Date(now);
      startOfMonth.setDate(startOfMonth.getDate() - 30);
      query.createdAt = { $gte: startOfMonth };
    }

    // Search by customer name or phone
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[Orders] Error getting orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

/**
 * Get single order by ID
 */
async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

/**
 * Mark order as delivered
 */
async function markDelivered(req, res) {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: 'delivered', deliveredAt: new Date() },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
}

/**
 * Export orders to Excel
 */
async function exportOrders(req, res) {
  try {
    const { from, to } = req.query;
    const query = {};

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Orders');

    sheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Items', key: 'items', width: 40 },
      { header: 'Total (₹)', key: 'total', width: 12 },
      { header: 'Payment', key: 'payment', width: 10 },
      { header: 'Delivery', key: 'delivery', width: 12 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };

    orders.forEach(order => {
      const itemsList = order.items.map(i => `${i.vegetableName} x${i.quantity}${i.unit}`).join(', ');
      sheet.addRow({
        orderId: order.orderId,
        date: order.createdAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
        customer: order.customerName,
        phone: order.customerPhone,
        items: itemsList,
        total: order.totalAmount,
        payment: order.paymentStatus,
        delivery: order.deliveryStatus,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().slice(0, 10)}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('[Orders] Export error:', error);
    res.status(500).json({ error: 'Failed to export orders' });
  }
}

/**
 * Update payment status (Confirm or Reject)
 */
async function updatePaymentStatus(req, res) {
  try {
    const { status } = req.body; // 'paid' or 'rejected'
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status === 'paid') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      await order.save();

      // Update customer stats
      await Customer.findOneAndUpdate(
        { phone: order.customerPhone },
        {
          $inc: { totalOrders: 1, totalSpent: order.totalAmount },
          lastOrderDate: new Date(),
        }
      );

      // Send receipt to customer
      const receiptService = require('../services/receipt');
      await receiptService.sendReceipt(order);

      // Update session if they are still waiting
      const Session = require('../models/Session');
      const session = await Session.findOne({ customerPhone: order.customerPhone });
      if (session && session.orderId === order.orderId) {
         session.stage = 'idle';
         session.selectedItems = [];
         session.currentItemIndex = 0;
         session.orderTotal = 0;
         session.orderId = null;
         await session.save();
      }

    } else if (status === 'rejected') {
      order.rejectionCount = (order.rejectionCount || 0) + 1;
      if (order.rejectionCount >= 2) {
        order.paymentStatus = 'rejected';
      } else {
        order.paymentStatus = 'awaiting_screenshot';
      }
      order.screenshotMediaId = null;
      await order.save();

      const whatsapp = require('../services/whatsapp');
      if (order.paymentStatus === 'rejected') {
         await whatsapp.sendTextMessage(order.customerPhone, `Aapka payment screenshot bar-bar galat hone ke karan order #${order.orderId} cancel kar diya gaya hai ❌\nKripya humse sampark karein.`);
      } else {
         await whatsapp.sendTextMessage(order.customerPhone, `Aapka payment screenshot verify nahi ho saka ❌\nKripya dobara sahi screenshot bhejiye.`);
      }

      // Update session if active
      const Session = require('../models/Session');
      const session = await Session.findOne({ customerPhone: order.customerPhone });
      if (session && session.orderId === order.orderId) {
        if (order.paymentStatus === 'rejected') {
          session.stage = 'idle';
        } else {
          session.stage = 'awaiting_screenshot';
        }
        await session.save();
      }
    }

    res.json(order);
  } catch (error) {
    console.error('[Orders] Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
}

/**
 * Fetch screenshot image for an order
 */
async function getScreenshot(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || !order.screenshotMediaId) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    const whatsapp = require('../services/whatsapp');
    const { buffer, mimeType } = await whatsapp.getMediaBuffer(order.screenshotMediaId);

    res.setHeader('Content-Type', mimeType);
    res.send(buffer);
  } catch (error) {
    console.error('[Orders] Get screenshot error:', error);
    res.status(500).json({ error: 'Failed to fetch screenshot' });
  }
}

module.exports = {
  getOrders,
  getOrderById,
  markDelivered,
  exportOrders,
  updatePaymentStatus,
  getScreenshot,
};
