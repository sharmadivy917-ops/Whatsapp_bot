const mongoose = require('mongoose');

const vegetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vegetable name is required'],
    trim: true,
  },
  emoji: {
    type: String,
    default: '🥬',
  },
  pricePerKg: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  unit: {
    type: String,
    enum: ['kg', 'piece', 'bunch'],
    default: 'kg',
  },
  availableToday: {
    type: Boolean,
    default: false,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
  },
}, {
  timestamps: true,
});

// Index for quick filtering of available vegetables
vegetableSchema.index({ availableToday: 1 });

module.exports = mongoose.model('Vegetable', vegetableSchema);
