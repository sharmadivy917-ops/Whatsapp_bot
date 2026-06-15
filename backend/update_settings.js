require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('./src/models/Settings');

async function updateSettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const settings = await Settings.findOne() || new Settings();
    settings.metaPhoneNumberId = '1178261698704607';
    settings.metaAccessToken = 'EAAVU6YQnqL4BRiP1nolTMISg0TZBeqjp7NVMVt2KvlM3d27EAVKjdZA5mdhvGNOutvxnWGfUXr2ZCeraekHawY7J8isaOTqYQ1ZBqWWwO4RmfGmtxL5q3WBL1S7mOmLNGLFpZC8HDxvcsm3wlGCWMBMyFwpp3ZA82ZBRlneVsQUOKg0IXbCABsXOc2IJwvB7PZBo4gIh94AGQeWxRetPS5e9vED1HfZC4zCk9rmxRjrLkQmpspWlBimmRRQfpeUh9bGegQkRHO8oU4n8gvCWzdWlw';
    settings.metaWebhookVerifyToken = 'vegbot123';
    await settings.save();
    
    console.log('✅ Settings successfully updated with your Meta credentials!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateSettings();
