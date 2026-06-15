const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Get Razorpay instance
 */
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.startsWith('your_')) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Create a Razorpay payment link
 * Returns { success, url, paymentLinkId } or { success: false, error }
 */
async function createPaymentLink(orderId, amount, customerPhone, customerName) {
  const razorpay = getRazorpayInstance();

  if (!razorpay) {
    // Mock mode — return a fake payment link
    const mockUrl = `https://rzp.io/mock/${orderId}`;
    console.log(`[Razorpay Mock] Payment link for ${orderId}: ${mockUrl} (₹${amount})`);
    return {
      success: true,
      mock: true,
      url: mockUrl,
      paymentLinkId: `mock_plink_${orderId}`,
    };
  }

  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      accept_partial: false,
      description: `Sabzi Order ${orderId}`,
      customer: {
        name: customerName || 'Customer',
        contact: `+${customerPhone}`,
      },
      notify: {
        sms: false,
        email: false,
        whatsapp: false, // We handle WhatsApp notification ourselves
      },
      reminder_enable: true,
      notes: {
        order_id: orderId,
        customer_phone: customerPhone,
      },
      callback_url: '', // Can be set to a thank-you page
      callback_method: 'get',
      expire_by: Math.floor(Date.now() / 1000) + 30 * 60, // Expire in 30 minutes
    });

    console.log(`[Razorpay] Payment link created: ${paymentLink.short_url}`);
    return {
      success: true,
      url: paymentLink.short_url,
      paymentLinkId: paymentLink.id,
    };
  } catch (error) {
    console.error('[Razorpay] Error creating payment link:', error);
    return {
      success: false,
      error: error.message || 'Payment link creation failed',
    };
  }
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || secret.startsWith('your_')) {
    console.log('[Razorpay Mock] Skipping webhook verification in mock mode');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return expectedSignature === signature;
}

module.exports = {
  createPaymentLink,
  verifyWebhookSignature,
};
