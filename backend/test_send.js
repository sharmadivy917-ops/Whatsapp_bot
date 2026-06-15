require('dotenv').config();
const mongoose = require('mongoose');
const { sendTextMessage } = require('./src/services/whatsapp');

async function testSend() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Testing WhatsApp send to 917984643964...');
    const result = await sendTextMessage('917984643964', 'This is a test from the diagnostic script!');
    console.log('Result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Crash:', error);
    process.exit(1);
  }
}
testSend();
