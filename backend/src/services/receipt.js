const whatsapp = require('./whatsapp');
const Settings = require('../models/Settings');

/**
 * Generate and send a receipt for a completed order via WhatsApp
 */
async function sendReceipt(order) {
  const settings = await Settings.getSettings();

  const dateObj = order.paidAt || order.createdAt || new Date();
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  // Build items list
  const itemLines = order.items.map(item => {
    const emoji = item.emoji || '';
    const unitLabel = item.unit === 'kg' ? 'kg' : item.unit === 'piece' ? 'pc' : 'bunch';
    return `${emoji} ${item.vegetableName} x ${item.quantity}${unitLabel}     ₹${item.subtotal}`;
  }).join('\n');

  // Payment method display
  const paymentMethodDisplay = order.paymentMethod
    ? order.paymentMethod.toUpperCase()
    : 'Online';

  const receipt = `✅ Payment successful! Shukriya!

🧾 RECEIPT
────────────────
Order ID: #${order.orderId}
Date: ${dateStr}
Time: ${timeStr}

${itemLines}
────────────────
Total Paid:       ₹${order.totalAmount}
Payment: ${paymentMethodDisplay} ✅
────────────────

Aapki sabziyan jald milenge! 🥦
Dubara aana, shukriya! 🙏
— ${settings.shopName}, ${settings.shopLocation}`;

  const result = await whatsapp.sendTextMessage(order.customerPhone, receipt);

  return result;
}

/**
 * Generate receipt text without sending (for preview)
 */
function generateReceiptText(order, settings) {
  const dateObj = order.paidAt || order.createdAt || new Date();
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const itemLines = order.items.map(item => {
    const unitLabel = item.unit === 'kg' ? 'kg' : item.unit === 'piece' ? 'pc' : 'bunch';
    return `${item.emoji || ''} ${item.vegetableName} x ${item.quantity}${unitLabel} — ₹${item.subtotal}`;
  }).join('\n');

  return `Order #${order.orderId} | ${dateStr}\n${itemLines}\nTotal: ₹${order.totalAmount}`;
}

module.exports = {
  sendReceipt,
  generateReceiptText,
};
