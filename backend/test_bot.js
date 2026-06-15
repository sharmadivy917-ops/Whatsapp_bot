require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Session = require('./src/models/Session');

const API = 'http://localhost:5000';
const TEST_PHONE = '918888800000';

async function sendMsg(text, type = 'text', interactiveData = null) {
  const msg = {
    from: TEST_PHONE,
    id: `msg_${Date.now()}_${Math.random()}`,
    type: type,
  };
  if (type === 'text') msg.text = { body: text };
  if (type === 'interactive') msg.interactive = interactiveData;

  const body = {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value: { contacts: [{ wa_id: TEST_PHONE }], messages: [msg] } }] }],
  };
  await axios.post(`${API}/webhook`, body);
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function dumpSession(step) {
  const s = await Session.findOne({ customerPhone: TEST_PHONE });
  console.log(`\n--- AFTER ${step} ---`);
  if (s) {
    console.log(`Stage: ${s.stage}`);
    console.log(`Index: ${s.currentItemIndex}`);
    console.log(`Items:`, JSON.stringify(s.selectedItems, null, 2));
  } else {
    console.log('NO SESSION');
  }
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Session.deleteMany({ customerPhone: TEST_PHONE });

  const Vegetable = require('./src/models/Vegetable');
  await Vegetable.deleteMany({ name: { $in: ['TestVeg1', 'TestVeg2'] } });
  const v1 = await Vegetable.create({ name: 'TestVeg1', emoji: '🥦', pricePerKg: 10, unit: 'kg', availableToday: true });
  const v2 = await Vegetable.create({ name: 'TestVeg2', emoji: '🥕', pricePerKg: 20, unit: 'kg', availableToday: true });

  console.log(`Using: ${v1.name} and ${v2.name}`);

  await sendMsg('HI');
  await wait(1000);
  await dumpSession('HI');

  await sendMsg('', 'interactive', { type: 'list_reply', list_reply: { id: v1._id } });
  await wait(1000);
  await dumpSession('Select Veg 1');

  await sendMsg('2');
  await wait(1000);
  await dumpSession('Quantity 2');

  await sendMsg('', 'interactive', { type: 'button_reply', button_reply: { id: 'add_more' } });
  await wait(1000);
  await dumpSession('Add More');

  await sendMsg('', 'interactive', { type: 'list_reply', list_reply: { id: v2._id } });
  await wait(1000);
  await dumpSession('Select Veg 2');

  await sendMsg('3');
  await wait(1000);
  await dumpSession('Quantity 3');

  await mongoose.disconnect();
}
run().catch(console.error);
