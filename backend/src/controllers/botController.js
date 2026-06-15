const Session = require('../models/Session');
const Vegetable = require('../models/Vegetable');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const Counter = require('../models/Counter');
const whatsapp = require('../services/whatsapp');

/**
 * Main entry point — process an incoming WhatsApp message
 */
async function handleIncomingMessage(senderPhone, messageBody, messageType, messageId, profileName) {
  try {
    // Mark message as read
    whatsapp.markAsRead(messageId);

    const settings = await Settings.getSettings();

    // --- SHOP TIMING CHECK ---
    // Check if shop is open (both manual toggle + timings)
    if (!settings.isCurrentlyOpen()) {
      const closedMsg = settings.isShopOpen
        ? settings.getClosedMessage(false)   // Closed by timing
        : settings.getClosedMessage(true);   // Manually closed by owner
      await whatsapp.sendTextMessage(senderPhone, closedMsg);
      return;
    }

    // --- BLOCKED CUSTOMER CHECK ---
    const customer = await Customer.findOne({ phone: senderPhone });
    if (customer && customer.isBlocked) {
      await whatsapp.sendTextMessage(senderPhone, 'Maaf kijiye, yeh seva aapke liye uplabdh nahi hai. 🙏');
      return;
    }

    // --- GET OR CREATE SESSION ---
    let session = await Session.findOne({ customerPhone: senderPhone });
    if (!session) {
      session = new Session({ customerPhone: senderPhone, stage: 'idle' });
    }

    // Normalize message text
    const text = (messageType === 'text' || messageType === 'interactive') ? (messageBody || '').trim().toUpperCase() : '';

    // --- EXPIRED ORDER CHECK ---
    const expiredOrder = await Order.findOne({ customerPhone: senderPhone, paymentStatus: 'expired' });
    if (expiredOrder) {
      if (text === '1') {
        expiredOrder.paymentStatus = 'awaiting_screenshot';
        await expiredOrder.save();
        session.stage = 'awaiting_screenshot';
        session.orderId = expiredOrder.orderId;
        await session.save();
        await whatsapp.sendTextMessage(senderPhone, 'Theek hai, apna screenshot bhejiye 📸');
        return;
      } else if (text === '2') {
        expiredOrder.paymentStatus = 'cancelled';
        await expiredOrder.save();
        await whatsapp.sendTextMessage(senderPhone, 'Purana order cancel ho gaya. Chalo naya order banate hain! 🥦');
        await resetSession(session);
        await sendVegetableList(senderPhone, settings);
        return;
      } else {
        await whatsapp.sendTextMessage(
          senderPhone,
          `Aapka ek purana order pending hai ⏳\n\nOrder ID: #${expiredOrder.orderId}\nTotal: ₹${expiredOrder.totalAmount}\n\nKya aapne payment kar diya tha?\n1 — Haan, screenshot bhejta/bhejti hoon\n2 — Nahi, naya order karna hai`
        );
        return;
      }
    }

    // --- SPECIAL COMMANDS (work from any stage) ---
    if (text === 'REPEAT') {
      await handleRepeatOrder(senderPhone, profileName, settings);
      return;
    }
    if (text === 'HISTORY') {
      await handleOrderHistory(senderPhone);
      return;
    }
    if (text === 'CANCEL' || text === 'RESET' || text === 'START' || text === 'HI' || text === 'HELLO') {
      await resetSession(session);
      await sendVegetableList(senderPhone, settings);
      session.stage = 'selecting';
      await session.save();
      return;
    }

    // --- ROUTE BY SESSION STAGE ---
    switch (session.stage) {
      case 'idle':
        await handleIdle(session, senderPhone, profileName, settings);
        break;
      case 'selecting':
        await handleSelecting(session, senderPhone, messageBody, messageType);
        break;
      case 'quantity':
        await handleQuantity(session, senderPhone, messageBody);
        break;
      case 'summary':
        await handleSummaryResponse(session, senderPhone, messageBody, messageType, profileName, settings);
        break;
      case 'awaiting_payment':
      case 'awaiting_screenshot':
        if (messageType === 'image') {
          const mediaId = messageBody; // from webhook
          const pendingOrder = await Order.findOne({ orderId: session.orderId });
          if (pendingOrder) {
            pendingOrder.paymentStatus = 'screenshot_received';
            pendingOrder.screenshotMediaId = mediaId;
            pendingOrder.paymentMethod = 'upi';
            await pendingOrder.save();
            await whatsapp.sendTextMessage(
              senderPhone, 
              `Shukriya! 📸 Aapka payment screenshot mil gaya.\nOwner verify karenge aur aapka order jald confirm hoga 🙏\n\nOrder ID: #${pendingOrder.orderId}`
            );
            session.stage = 'done';
            await session.save();
          } else {
             await whatsapp.sendTextMessage(senderPhone, 'Koi pending order nahi mila.');
             await resetSession(session);
          }
        } else {
          await whatsapp.sendTextMessage(
            senderPhone,
            'Aapka payment screenshot baki hai. 📸\nKripya upar diye gaye link par payment karke screenshot bhejiye.\n\nAgar naya order karna hai toh "CANCEL" type karein.'
          );
        }
        break;
      case 'done':
        // Reset and start fresh
        await resetSession(session);
        await handleIdle(session, senderPhone, profileName, settings);
        break;
      default:
        await resetSession(session);
        await handleIdle(session, senderPhone, profileName, settings);
    }
  } catch (error) {
    console.error('[Bot] Error handling message:', error);
    await whatsapp.sendTextMessage(
      senderPhone,
      'Maaf kijiye, kuch galat ho gaya. 😔\nKripya dobara try karein ya "HI" bhejein.'
    );
  }
}

/**
 * Stage: idle — Send welcome message + vegetable list
 */
async function handleIdle(session, phone, profileName, settings) {
  // Ensure/update customer record
  await Customer.findOneAndUpdate(
    { phone },
    {
      phone,
      $setOnInsert: { name: profileName || 'Customer', firstOrderDate: new Date() },
    },
    { upsert: true, new: true }
  );

  // Update customer name if available
  if (profileName) {
    await Customer.updateOne({ phone }, { name: profileName });
  }

  await sendVegetableList(phone, settings);

  session.stage = 'selecting';
  session.selectedItems = [];
  session.currentItemIndex = 0;
  session.orderTotal = 0;
  session.orderId = null;
  await session.save();
}

/**
 * Send the vegetable list as an interactive list message
 */
async function sendVegetableList(phone, settings) {
  const vegetables = await Vegetable.find({ availableToday: true }).sort({ name: 1 });

  if (vegetables.length === 0) {
    await whatsapp.sendTextMessage(
      phone,
      `${settings.welcomeMessage}\n\nMaaf kijiye, aaj koi sabzi uplabdh nahi hai. 😔\nKal zaroor check karein!`
    );
    return;
  }

  // Build list sections (Meta allows max 10 items per section, max 10 sections)
  const rows = vegetables.map(veg => ({
    id: veg._id.toString(),
    title: veg.emoji ? `${veg.emoji} ${veg.name}` : veg.name,
    description: `₹${veg.pricePerKg}/${veg.unit}`,
  }));

  // Split into sections of 10 if needed
  const sections = [];
  for (let i = 0; i < rows.length; i += 10) {
    sections.push({
      title: sections.length === 0 ? 'Aaj Ki Sabziyan' : `Aur Sabziyan (${sections.length + 1})`,
      rows: rows.slice(i, i + 10),
    });
  }

  await whatsapp.sendListMessage(
    phone,
    'Taza Sabziyan 🥦',
    settings.welcomeMessage,
    'Sabziyan Dekhein 👀',
    sections
  );
}

/**
 * Stage: selecting — Process vegetable selection from list
 */
async function handleSelecting(session, phone, messageBody, messageType) {
  let selectedVegId = null;

  // Interactive list reply — messageBody is the selected row ID
  if (messageType === 'interactive') {
    selectedVegId = messageBody;
  } else {
    // Text-based fallback — try to match vegetable name
    const vegetables = await Vegetable.find({ availableToday: true });
    const match = vegetables.find(v =>
      v.name.toLowerCase() === messageBody.toLowerCase().trim()
    );
    if (match) {
      selectedVegId = match._id.toString();
    }
  }

  if (!selectedVegId) {
    await whatsapp.sendTextMessage(
      phone,
      'Maaf kijiye, samajh nahi aaya. 🤔\nKripya list mein se sabzi chunein ya "HI" bhejein dobara shuru karne ke liye.'
    );
    return;
  }

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(selectedVegId)) {
    await whatsapp.sendTextMessage(phone, 'Maaf kijiye, samajh nahi aaya. 🤔\nKripya list mein se sabzi chunein ya "HI" bhejein.');
    return;
  }

  const vegetable = await Vegetable.findById(selectedVegId);
  if (!vegetable || !vegetable.availableToday) {
    await whatsapp.sendTextMessage(phone, 'Yeh sabzi aaj uplabdh nahi hai. Koi aur chunein. 🙏');
    return;
  }

  // Add to selected items
  session.selectedItems.push({
    vegetableId: vegetable._id,
    vegetableName: vegetable.name,
    emoji: vegetable.emoji,
    pricePerUnit: vegetable.pricePerKg,
    unit: vegetable.unit,
    quantity: 0,
  });

  session.currentItemIndex = session.selectedItems.length - 1;
  session.stage = 'quantity';
  await session.save();

  const unitLabel = vegetable.unit === 'kg' ? 'kilo' : vegetable.unit === 'piece' ? 'piece' : 'bunch';
  await whatsapp.sendTextMessage(
    phone,
    `Aapne ${vegetable.emoji} ${vegetable.name} choose kiya ✅\nKitne ${unitLabel} chahiye? (sirf number type karein)\n\nExample: 2 ya 0.5`
  );
}

/**
 * Stage: quantity — Process quantity input for selected vegetable
 */
async function handleQuantity(session, phone, messageBody) {
  const qty = parseFloat(messageBody.trim());

  if (isNaN(qty) || qty <= 0 || qty > 100) {
    await whatsapp.sendTextMessage(
      phone,
      'Kripya sahi number daalein (0.25 se 100 tak). 🔢\nExample: 2 ya 0.5'
    );
    return;
  }

  // Update quantity for current item
  const currentItem = session.selectedItems[session.currentItemIndex];
  currentItem.quantity = qty;
  session.markModified('selectedItems');
  await session.save();

  // Ask if they want to add more or proceed to summary
  await whatsapp.sendButtonMessage(
    phone,
    `${currentItem.emoji} ${currentItem.vegetableName} — ${qty} ${currentItem.unit} ✅\n(₹${currentItem.pricePerUnit} × ${qty} = ₹${(currentItem.pricePerUnit * qty).toFixed(0)})\n\nAur sabzi add karni hai?`,
    [
      { id: 'add_more', title: 'Aur Add Karo ➕' },
      { id: 'show_summary', title: 'Bas, Order Dekho 🧾' },
    ]
  );

  session.stage = 'summary';
  await session.save();
}

/**
 * Stage: summary — Handle "add more" or "show summary" response
 */
async function handleSummaryResponse(session, phone, messageBody, messageType, profileName, settings) {
  let choice = '';

  if (messageType === 'interactive') {
    choice = messageBody; // button ID: 'add_more' or 'show_summary'
  } else {
    const text = messageBody.trim().toLowerCase();
    if (text === '1' || text.includes('haan') || text.includes('yes') || text.includes('confirm')) {
      choice = 'confirm_order';
    } else if (text === '2' || text.includes('nahi') || text.includes('no') || text.includes('dobara')) {
      choice = 'restart';
    } else if (text.includes('add') || text.includes('aur')) {
      choice = 'add_more';
    } else {
      choice = 'show_summary';
    }
  }

  if (choice === 'add_more') {
    // Go back to selecting stage
    session.stage = 'selecting';
    await session.save();
    await whatsapp.sendTextMessage(phone, 'Aur kaunsi sabzi chahiye? List mein se chunein 👇');
    await sendVegetableList(phone, settings);
    return;
  }

  if (choice === 'confirm_order') {
    // Create the order and generate payment link
    await createOrderAndSendPayment(session, phone, profileName, settings);
    return;
  }

  if (choice === 'restart') {
    await resetSession(session);
    await whatsapp.sendTextMessage(phone, 'Koi baat nahi! Chalo dobara shuru karte hain. 😊');
    await sendVegetableList(phone, settings);
    session.stage = 'selecting';
    await session.save();
    return;
  }

  // Default: show order summary
  await showOrderSummary(session, phone);
}

/**
 * Display order summary and ask for confirmation
 */
async function showOrderSummary(session, phone) {
  let total = 0;
  const lines = session.selectedItems
    .filter(item => item.quantity > 0)
    .map(item => {
      const subtotal = item.pricePerUnit * item.quantity;
      total += subtotal;
      const unitLabel = item.unit === 'kg' ? 'kg' : item.unit === 'piece' ? 'pc' : 'bunch';
      return `${item.emoji} ${item.vegetableName} x ${item.quantity}${unitLabel} — ₹${subtotal.toFixed(0)}`;
    });

  if (lines.length === 0) {
    await whatsapp.sendTextMessage(phone, 'Aapne abhi koi sabzi nahi chuni. "HI" bhejein dobara shuru karne ke liye.');
    return;
  }

  session.orderTotal = total;
  await session.save();

  const summaryText = `Aapka order summary 🧾\n\n${lines.join('\n')}\n\n────────────────\nTotal: ₹${total.toFixed(0)}\n────────────────\n\nConfirm karna hai?`;

  await whatsapp.sendButtonMessage(
    phone,
    summaryText,
    [
      { id: 'confirm_order', title: 'Haan, Confirm ✅' },
      { id: 'restart', title: 'Dobara Chunna 🔄' },
    ]
  );

  // Stay in summary stage to handle response
  session.stage = 'summary';
  await session.save();
}

/**
 * Create order in DB, generate UPI payment link, send to customer
 */
async function createOrderAndSendPayment(session, phone, profileName, settings) {
  const items = session.selectedItems
    .filter(item => item.quantity > 0)
    .map(item => ({
      vegetableName: item.vegetableName,
      emoji: item.emoji,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      subtotal: parseFloat((item.pricePerUnit * item.quantity).toFixed(2)),
    }));

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Ensure customer exists
  await Customer.findOneAndUpdate(
    { phone },
    {
      phone,
      $setOnInsert: { name: profileName || 'Customer', firstOrderDate: new Date() },
    },
    { upsert: true, new: true }
  );

  // Update customer name if available
  if (profileName) {
    await Customer.updateOne({ phone }, { name: profileName });
  }

  // Create order
  const order = new Order({
    customerPhone: phone,
    customerName: profileName || 'Customer',
    items,
    totalAmount,
    paymentStatus: 'awaiting_screenshot',
    deliveryStatus: 'processing',
  });
  await order.save();

  // Update session
  session.orderId = order.orderId;
  session.orderTotal = totalAmount;
  session.stage = 'awaiting_screenshot';
  await session.save();

  const upiId = settings.ownerUPIId || 'owner@upi';
  const ownerName = encodeURIComponent(settings.ownerName || 'Ramesh Sabziwala');
  const tn = encodeURIComponent(`VegOrder#${order.orderId}`);
  const upiLink = `upi://pay?pa=${upiId}&pn=${ownerName}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${tn}`;

  await whatsapp.sendTextMessage(
    phone,
    `Bahut badiya! 🎉\nNiche UPI link pe click karein aur payment karein:\n\n👉 ${upiLink}\n\nAapka GPay, PhonePe, Paytm — sab chalega ✅\nPayment ke baad apna screenshot yahan bhejiye 📸`
  );
}

/**
 * Handle REPEAT command — reorder last order
 */
async function handleRepeatOrder(phone, profileName, settings) {
  const lastOrder = await Order.findOne({
    customerPhone: phone,
    paymentStatus: 'paid',
  }).sort({ createdAt: -1 });

  if (!lastOrder) {
    await whatsapp.sendTextMessage(
      phone,
      'Aapka koi purana order nahi mila. 🤔\nNaya order karne ke liye "HI" bhejein!'
    );
    return;
  }

  // Check if all items are still available
  const unavailable = [];
  for (const item of lastOrder.items) {
    const veg = await Vegetable.findOne({ name: item.vegetableName });
    if (!veg || !veg.availableToday) {
      unavailable.push(item.vegetableName);
    }
  }

  if (unavailable.length > 0) {
    await whatsapp.sendTextMessage(
      phone,
      `Aapke last order mein se yeh sabziyan aaj uplabdh nahi hain: ${unavailable.join(', ')} 😔\n\nNaya order karne ke liye "HI" bhejein!`
    );
    return;
  }

  // Create a new session with the same items
  let session = await Session.findOne({ customerPhone: phone });
  if (!session) {
    session = new Session({ customerPhone: phone });
  }

  session.selectedItems = lastOrder.items.map(item => ({
    vegetableName: item.vegetableName,
    emoji: item.emoji,
    pricePerUnit: item.pricePerUnit,
    unit: item.unit,
    quantity: item.quantity,
  }));
  session.stage = 'summary';
  await session.save();

  // Show summary directly
  await showOrderSummary(session, phone);
}

/**
 * Handle HISTORY command — show last 3 orders
 */
async function handleOrderHistory(phone) {
  const orders = await Order.find({ customerPhone: phone })
    .sort({ createdAt: -1 })
    .limit(3);

  if (orders.length === 0) {
    await whatsapp.sendTextMessage(
      phone,
      'Aapne abhi tak koi order nahi kiya. 🤔\nOrder karne ke liye "HI" bhejein!'
    );
    return;
  }

  let historyText = '📋 Aapke recent orders:\n\n';

  orders.forEach((order, idx) => {
    const date = order.createdAt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kolkata',
    });
    const itemsList = order.items.map(i => `${i.emoji || ''} ${i.vegetableName} x${i.quantity}${i.unit}`).join(', ');
    const status = order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending';

    historyText += `${idx + 1}. #${order.orderId} (${date})\n   ${itemsList}\n   Total: ₹${order.totalAmount} — ${status}\n\n`;
  });

  historyText += 'Phir se order karne ke liye "HI" bhejein\nYa last order repeat karne ke liye "REPEAT" bhejein';

  await whatsapp.sendTextMessage(phone, historyText);
}

/**
 * Reset session to idle
 */
async function resetSession(session) {
  session.stage = 'idle';
  session.selectedItems = [];
  session.currentItemIndex = 0;
  session.orderTotal = 0;
  session.orderId = null;
  await session.save();
}

module.exports = {
  handleIncomingMessage,
};
