const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: {
    type: String,
    default: 'Ramesh Sabziwala',
  },
  ownerName: {
    type: String,
    default: 'Ramesh',
  },
  shopLocation: {
    type: String,
    default: 'Godhra',
  },
  isShopOpen: {
    type: Boolean,
    default: true,
  },
  shopTimings: {
    openHour: { type: Number, default: 7, min: 0, max: 23 },   // 7 AM
    openMinute: { type: Number, default: 0, min: 0, max: 59 },
    closeHour: { type: Number, default: 21, min: 0, max: 23 },  // 9 PM
    closeMinute: { type: Number, default: 0, min: 0, max: 59 },
  },
  welcomeMessage: {
    type: String,
    default: 'Jai Shree Krishna! 🙏\nAaj ki taza sabziyan yahan hain 🥦\n\nNiche se apni sabziyan chuniye 👇',
  },
  closedMessage: {
    type: String,
    default: 'Jai Shree Krishna! 🙏\nAbhi hamari dukaan band hai. 🕐\n\nDukaan ka samay: subah {openHour}:{openMinute} se raat {closeHour}:{closeMinute} tak.\n\nKal zaroor aaiye! 🙏\n— {shopName}, {shopLocation}',
  },
  manualClosedMessage: {
    type: String,
    default: 'Jai Shree Krishna! 🙏\nAaj dukaan band hai. Kal zaroor aaiye! 🙏\n— {shopName}, {shopLocation}',
  },
  ownerPhone: {
    type: String,
    default: '',
  },
  ownerUPIId: { type: String, default: '' },
  metaAccessToken: { type: String, default: '' },
  metaPhoneNumberId: { type: String, default: '' },
  metaWebhookVerifyToken: { type: String, default: '' },
}, {
  timestamps: true,
});

// Singleton pattern — always get/create the one settings doc
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Check if shop is currently open based on timings and manual toggle
settingsSchema.methods.isCurrentlyOpen = function () {
  // Manual override — if owner turned shop off, it's closed
  if (!this.isShopOpen) return false;

  // Check timings
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const currentHour = istNow.getUTCHours();
  const currentMinute = istNow.getUTCMinutes();

  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const openTotalMinutes = this.shopTimings.openHour * 60 + this.shopTimings.openMinute;
  const closeTotalMinutes = this.shopTimings.closeHour * 60 + this.shopTimings.closeMinute;

  return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes;
};

// Get formatted closed message with placeholders replaced
settingsSchema.methods.getClosedMessage = function (isManual = false) {
  const template = isManual ? this.manualClosedMessage : this.closedMessage;
  return template
    .replace(/{shopName}/g, this.shopName)
    .replace(/{shopLocation}/g, this.shopLocation)
    .replace(/{ownerName}/g, this.ownerName)
    .replace(/{openHour}/g, String(this.shopTimings.openHour).padStart(2, '0'))
    .replace(/{openMinute}/g, String(this.shopTimings.openMinute).padStart(2, '0'))
    .replace(/{closeHour}/g, String(this.shopTimings.closeHour).padStart(2, '0'))
    .replace(/{closeMinute}/g, String(this.shopTimings.closeMinute).padStart(2, '0'));
};

module.exports = mongoose.model('Settings', settingsSchema);
