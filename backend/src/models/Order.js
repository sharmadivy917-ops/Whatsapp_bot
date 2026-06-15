const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  vegetableName: { type: String, required: true },
  emoji: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0.25 },
  unit: { type: String, enum: ['kg', 'piece', 'bunch'], default: 'kg' },
  pricePerUnit: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
    index: true,
  },
  customerName: {
    type: String,
    default: 'Customer',
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'awaiting_screenshot', 'screenshot_received', 'paid', 'rejected', 'expired', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'unknown', ''],
    default: '',
  },
  screenshotMediaId: String,
  rejectionCount: {
    type: Number,
    default: 0,
  },
  deliveryStatus: {
    type: String,
    enum: ['processing', 'delivered'],
    default: 'processing',
  },
  receiptSent: {
    type: Boolean,
    default: false,
  },
  paidAt: Date,
  deliveredAt: Date,
}, {
  timestamps: true,
});

// Auto-generate orderId before validation
orderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderId) {
    try {
      const Counter = mongoose.model('Counter');
      const counter = await Counter.findOneAndUpdate(
        { name: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const year = new Date().getFullYear();
      this.orderId = `VEG${year}${String(counter.seq).padStart(4, '0')}`;
    } catch (err) {
      // Fallback: use timestamp-based ID
      this.orderId = `VEG${Date.now()}`;
    }
  }
  next();
});

// Indexes for common queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ deliveryStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
