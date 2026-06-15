const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  customerPhone: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  stage: {
    type: String,
    enum: ['idle', 'selecting', 'quantity', 'summary', 'awaiting_payment', 'awaiting_screenshot', 'done'],
    default: 'idle',
  },
  selectedItems: [{
    vegetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vegetable' },
    vegetableName: String,
    emoji: String,
    pricePerUnit: Number,
    unit: String,
    quantity: Number,
  }],
  currentItemIndex: {
    type: Number,
    default: 0,
  },
  orderTotal: {
    type: Number,
    default: 0,
  },
  orderId: String,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
  },
});

// TTL index — auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update lastUpdated and extend expiry on every save
sessionSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  this.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
