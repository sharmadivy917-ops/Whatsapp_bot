const mongoose = require('mongoose');

// Simple counter collection for auto-incrementing order IDs
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
