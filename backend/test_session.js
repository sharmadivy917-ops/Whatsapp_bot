require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('./src/models/Session');
const Vegetable = require('./src/models/Vegetable');

async function testSessionFlow() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 1. Create a session
  await Session.deleteMany({ customerPhone: 'test_phone' });
  let session = new Session({ customerPhone: 'test_phone', stage: 'idle' });
  await session.save();

  // 2. Select Tamatar
  const tamatarId = new mongoose.Types.ObjectId();
  session = await Session.findOne({ customerPhone: 'test_phone' });
  session.selectedItems.push({
    vegetableId: tamatarId,
    vegetableName: 'Tamatar',
    emoji: '🍅',
    pricePerUnit: 40,
    unit: 'kg',
    quantity: 0,
  });
  session.currentItemIndex = session.selectedItems.length - 1;
  session.stage = 'quantity';
  await session.save();

  // 3. Enter Quantity 2
  session = await Session.findOne({ customerPhone: 'test_phone' });
  let currentItem = session.selectedItems[session.currentItemIndex];
  currentItem.quantity = 2;
  session.markModified('selectedItems');
  await session.save();

  // 4. Add More
  session = await Session.findOne({ customerPhone: 'test_phone' });
  session.stage = 'selecting';
  await session.save();

  // 5. Select Aloo
  const alooId = new mongoose.Types.ObjectId();
  session = await Session.findOne({ customerPhone: 'test_phone' });
  session.selectedItems.push({
    vegetableId: alooId,
    vegetableName: 'Aloo',
    emoji: '🥔',
    pricePerUnit: 30,
    unit: 'kg',
    quantity: 0,
  });
  session.currentItemIndex = session.selectedItems.length - 1;
  session.stage = 'quantity';
  await session.save();

  // 6. Enter Quantity 3
  session = await Session.findOne({ customerPhone: 'test_phone' });
  currentItem = session.selectedItems[session.currentItemIndex];
  currentItem.quantity = 3;
  session.markModified('selectedItems');
  await session.save();

  // Print final
  session = await Session.findOne({ customerPhone: 'test_phone' });
  console.log(JSON.stringify(session.selectedItems, null, 2));

  await mongoose.disconnect();
}

testSessionFlow().catch(console.error);
