const Vegetable = require('../models/Vegetable');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const whatsapp = require('../services/whatsapp');

/**
 * Set up all scheduled cron jobs
 */
function setupCronJobs(cron) {
  // === MIDNIGHT RESET — Reset all vegetables to unavailable at 00:00 IST ===
  // Cron runs at 00:00 IST = 18:30 UTC (previous day)
  cron.schedule('30 18 * * *', async () => {
    try {
      const result = await Vegetable.updateMany({}, { availableToday: false });
      console.log(`[Cron] Midnight reset: ${result.modifiedCount} vegetables set to unavailable`);
    } catch (error) {
      console.error('[Cron] Midnight reset error:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  // === DAILY SALES REPORT — Send to owner at 10 PM IST ===
  cron.schedule('0 22 * * *', async () => {
    try {
      const settings = await Settings.getSettings();
      const ownerPhone = settings.ownerPhone || process.env.OWNER_PHONE;

      if (!ownerPhone) {
        console.log('[Cron] No owner phone configured for daily report');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersToday, revenueToday, pendingCount] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: today } }),
        Order.aggregate([
          { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Order.countDocuments({ deliveryStatus: 'processing', paymentStatus: 'paid' }),
      ]);

      const revenue = revenueToday[0]?.total || 0;
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });

      const report = `📊 Daily Sales Report\n${dateStr}\n────────────────\n\n🛒 Total Orders: ${ordersToday}\n💰 Revenue: ₹${revenue}\n📦 Pending Deliveries: ${pendingCount}\n\n────────────────\n— ${settings.shopName} Bot`;

      await whatsapp.sendTextMessage(ownerPhone, report);
      console.log('[Cron] Daily report sent to owner');
    } catch (error) {
      console.error('[Cron] Daily report error:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  // === LOW STOCK CHECK — Run every hour ===
  cron.schedule('0 * * * *', async () => {
    try {
      const lowStockVegs = await Vegetable.find({
        availableToday: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        stock: { $gt: 0 }, // Only alert if stock is tracked (> 0)
      });

      if (lowStockVegs.length === 0) return;

      const settings = await Settings.getSettings();
      const ownerPhone = settings.ownerPhone || process.env.OWNER_PHONE;
      if (!ownerPhone) return;

      const vegList = lowStockVegs.map(v => `${v.emoji} ${v.name}: ${v.stock} ${v.unit} remaining`).join('\n');
      const alert = `⚠️ Low Stock Alert!\n\n${vegList}\n\nDashboard se stock update karein.`;

      await whatsapp.sendTextMessage(ownerPhone, alert);
      console.log(`[Cron] Low stock alert sent for ${lowStockVegs.length} items`);
    } catch (error) {
      console.error('[Cron] Low stock check error:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  // === EXPIRED ORDERS CHECK — Run every hour ===
  cron.schedule('0 * * * *', async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = await Order.updateMany(
        { paymentStatus: 'awaiting_screenshot', createdAt: { $lte: twoHoursAgo } },
        { paymentStatus: 'expired' }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Cron] Expired ${result.modifiedCount} pending orders`);
      }
    } catch (error) {
      console.error('[Cron] Expired orders check error:', error);
    }
  });

  console.log('[Cron] All scheduled jobs registered');
}

module.exports = { setupCronJobs };
