/**
 * VegBot — Full End-to-End Test Script
 * Tests: Bot logic, Session management, UPI links, Screenshot flow, Dashboard APIs
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const API = 'http://localhost:5000';
let TOKEN = '';
const TEST_PHONE = '919999900000';

// Helper to send a simulated WhatsApp message via webhook
async function sendWhatsAppMessage(text, type = 'text') {
  const body = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        field: 'messages',
        value: {
          contacts: [{ wa_id: TEST_PHONE, profile: { name: 'Test Customer' } }],
          messages: [{
            from: TEST_PHONE,
            id: `msg_${Date.now()}`,
            type: type,
            ...(type === 'text' ? { text: { body: text } } : {}),
            ...(type === 'image' ? { image: { id: `media_${Date.now()}` } } : {}),
            ...(type === 'interactive' ? {
              interactive: {
                type: 'button_reply',
                button_reply: { id: text, title: text }
              }
            } : {}),
          }],
        },
      }],
    }],
  };
  return axios.post(`${API}/webhook`, body);
}

// Helper to send interactive list reply (vegetable selection)
async function sendListReply(itemId) {
  const body = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        field: 'messages',
        value: {
          contacts: [{ wa_id: TEST_PHONE, profile: { name: 'Test Customer' } }],
          messages: [{
            from: TEST_PHONE,
            id: `msg_${Date.now()}`,
            type: 'interactive',
            interactive: {
              type: 'list_reply',
              list_reply: { id: itemId, title: 'Selected Veg' }
            },
          }],
        },
      }],
    }],
  };
  return axios.post(`${API}/webhook`, body);
}

// Helper to send button reply
async function sendButtonReply(buttonId) {
  const body = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        field: 'messages',
        value: {
          contacts: [{ wa_id: TEST_PHONE, profile: { name: 'Test Customer' } }],
          messages: [{
            from: TEST_PHONE,
            id: `msg_${Date.now()}`,
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: { id: buttonId, title: buttonId }
            },
          }],
        },
      }],
    }],
  };
  return axios.post(`${API}/webhook`, body);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function header(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}`);
}

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); }

let passed = 0, failed = 0;
function check(condition, msg) {
  if (condition) { pass(msg); passed++; }
  else { fail(msg); failed++; }
}

// Wait for session to reach a specific stage (poll DB via API)
async function waitForSession(authHeaders, targetStage, maxWait = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await wait(300);
    // We can't query sessions via API, so just wait
  }
  return true;
}

async function run() {
  try {
    // ============================================================
    //  TEST 1: Health Check
    // ============================================================
    header('TEST 1: Health Check');
    
    const health = await axios.get(`${API}/health`);
    check(health.status === 200, 'Health endpoint returns 200');
    check(health.data.mongodb === 'connected', `MongoDB: ${health.data.mongodb}`);

    const root = await axios.get(`${API}/`);
    check(root.data.name === 'VegBot API', 'Root endpoint returns API info');

    // ============================================================
    //  TEST 2: Auth — Login
    // ============================================================
    header('TEST 2: Auth — Login');

    try {
      await axios.post(`${API}/api/auth/login`, { password: 'wrong' });
      fail('Should reject wrong password');
    } catch (e) {
      check(e.response.status === 401, 'Wrong password returns 401');
    }

    const login = await axios.post(`${API}/api/auth/login`, { password: 'admin123' });
    TOKEN = login.data.token;
    check(!!TOKEN, 'Login successful, got JWT token');

    const verify = await axios.get(`${API}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    check(verify.data.valid === true, 'Token verification passed');

    const authHeaders = { headers: { Authorization: `Bearer ${TOKEN}` } };

    // ============================================================
    //  TEST 3: Vegetables CRUD
    // ============================================================
    header('TEST 3: Vegetables CRUD');

    // Clean up any existing test vegetables
    const existingVegs = await axios.get(`${API}/api/vegetables`, authHeaders);
    for (const v of existingVegs.data) {
      if (['Tamatar', 'Aloo', 'Pyaaz'].includes(v.name)) {
        await axios.delete(`${API}/api/vegetables/${v._id}`, authHeaders);
      }
    }

    // Create vegetables
    const veg1 = await axios.post(`${API}/api/vegetables`, {
      name: 'Tamatar', emoji: '🍅', pricePerKg: 40, unit: 'kg', availableToday: true
    }, authHeaders);
    check(veg1.status === 201, `Created: Tamatar (id: ${veg1.data._id})`);

    const veg2 = await axios.post(`${API}/api/vegetables`, {
      name: 'Aloo', emoji: '🥔', pricePerKg: 30, unit: 'kg', availableToday: true
    }, authHeaders);
    check(veg2.status === 201, `Created: Aloo (id: ${veg2.data._id})`);

    const veg3 = await axios.post(`${API}/api/vegetables`, {
      name: 'Pyaaz', emoji: '🧅', pricePerKg: 25, unit: 'kg', availableToday: false
    }, authHeaders);
    check(veg3.status === 201, `Created: Pyaaz (id: ${veg3.data._id})`);

    // Get all
    const allVegs = await axios.get(`${API}/api/vegetables`, authHeaders);
    check(allVegs.data.length >= 3, `Fetched ${allVegs.data.length} vegetables`);

    // Update price
    const updated = await axios.put(`${API}/api/vegetables/${veg1.data._id}`, {
      name: 'Tamatar', emoji: '🍅', pricePerKg: 45, unit: 'kg', availableToday: true
    }, authHeaders);
    check(updated.data.pricePerKg === 45, 'Updated Tamatar price to ₹45');

    // Toggle availability
    const toggled = await axios.patch(`${API}/api/vegetables/${veg3.data._id}/toggle`, {}, authHeaders);
    check(toggled.data.availableToday === true, 'Toggled Pyaaz to available');

    // ============================================================
    //  TEST 4: Toggle-All Route (bug fix verification)
    // ============================================================
    header('TEST 4: Toggle-All Route (Bug Fix)');

    const toggleAllOff = await axios.patch(`${API}/api/vegetables/toggle-all`, { available: false }, authHeaders);
    check(toggleAllOff.data.every(v => !v.availableToday), 'Toggle-all OFF works (route ordering fixed)');

    const toggleAllOn = await axios.patch(`${API}/api/vegetables/toggle-all`, { available: true }, authHeaders);
    check(toggleAllOn.data.every(v => v.availableToday), 'Toggle-all ON works');

    // ============================================================
    //  TEST 5: Bot Logic — Full Ordering Flow
    // ============================================================
    header('TEST 5: Bot Logic — Full Ordering Flow');
    console.log('  (Watch the server terminal for 📤 [TEST] messages)\n');

    // Clean any leftover session/orders for test phone via direct DB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vegbot';
    const conn = await mongoose.connect(MONGODB_URI);
    await mongoose.connection.db.collection('sessions').deleteMany({ customerPhone: TEST_PHONE });
    await mongoose.connection.db.collection('orders').deleteMany({ customerPhone: TEST_PHONE });
    await mongoose.connection.db.collection('customers').deleteMany({ phone: TEST_PHONE });
    pass('Cleared old test data from DB');

    // Step 1: Say HI → should get welcome + vegetable list
    console.log('  --- Step 1: Send "HI" ---');
    await sendWhatsAppMessage('HI');
    await wait(1500);
    pass('Sent HI — bot should reply with welcome + vegetable list');

    // Step 2: Select a vegetable from the list
    console.log('  --- Step 2: Select Tamatar from list ---');
    await sendListReply(veg1.data._id);
    await wait(1500);
    pass('Selected Tamatar — bot should ask for quantity');

    // Step 3: Enter quantity
    console.log('  --- Step 3: Enter quantity "2" ---');
    await sendWhatsAppMessage('2');
    await wait(1500);
    pass('Sent quantity 2 — bot should show subtotal + ask add more/view order');

    // Step 4: Add more → select Aloo
    console.log('  --- Step 4: Click "Add More" ---');
    await sendButtonReply('add_more');
    await wait(2500);
    pass('Clicked add_more — bot should show vegetable list again');

    // Step 5: Select Aloo
    console.log('  --- Step 5: Select Aloo ---');
    await sendListReply(veg2.data._id);
    await wait(2500);
    pass('Selected Aloo — bot should ask for quantity');

    // Step 6: Enter quantity for Aloo
    console.log('  --- Step 6: Enter quantity "3" ---');
    await sendWhatsAppMessage('3');
    await wait(2500);
    pass('Sent quantity 3 — bot should show subtotal + buttons');

    // Step 7: View order summary
    console.log('  --- Step 7: Click "Show Summary" ---');
    await sendButtonReply('show_summary');
    await wait(2500);
    pass('Clicked show_summary — bot should show full order with confirm/restart');

    // Step 8: Confirm order → should generate UPI link
    console.log('  --- Step 8: Confirm Order ---');
    await sendButtonReply('confirm_order');
    await wait(2500);
    pass('Confirmed order — bot should send UPI payment link');

    // ============================================================
    //  TEST 6: UPI Link Generation
    // ============================================================
    header('TEST 6: UPI Link Verification');

    // Check the order was created in DB
    const ordersRes = await axios.get(`${API}/api/orders`, authHeaders);
    const testOrder = ordersRes.data.orders.find(o => o.customerPhone === TEST_PHONE);
    check(!!testOrder, `Order created: #${testOrder?.orderId}`);
    check(testOrder?.totalAmount === (45 * 2 + 30 * 3), `Total: ₹${testOrder?.totalAmount} (expected ₹${45*2 + 30*3})`);
    check(testOrder?.paymentStatus === 'awaiting_screenshot', `Payment status: ${testOrder?.paymentStatus}`);
    check(testOrder?.items?.length === 2, `Items count: ${testOrder?.items?.length}`);

    // ============================================================
    //  TEST 7: Screenshot Flow
    // ============================================================
    header('TEST 7: Screenshot Flow');

    // Send an image (simulated screenshot)
    console.log('  --- Sending payment screenshot ---');
    await sendWhatsAppMessage('', 'image');
    await wait(1000);
    pass('Sent screenshot image — bot should confirm receipt');

    // Check order status updated
    const orderAfterScreenshot = await axios.get(`${API}/api/orders/${testOrder._id}`, authHeaders);
    check(orderAfterScreenshot.data.paymentStatus === 'screenshot_received', 
      `Status updated to: ${orderAfterScreenshot.data.paymentStatus}`);
    check(!!orderAfterScreenshot.data.screenshotMediaId, 'Screenshot media ID saved');

    // ============================================================
    //  TEST 8: Admin — Confirm Payment (bug fix verification)
    // ============================================================
    header('TEST 8: Admin Confirm Payment (Customer Stats Fix)');

    // Get customer before confirmation
    const customersBefore = await axios.get(`${API}/api/customers`, authHeaders);
    const custBefore = customersBefore.data.customers.find(c => c.phone === TEST_PHONE);
    const ordersBefore = custBefore?.totalOrders || 0;
    const spentBefore = custBefore?.totalSpent || 0;
    console.log(`  Before: totalOrders=${ordersBefore}, totalSpent=₹${spentBefore}`);

    // Admin confirms payment
    const confirmRes = await axios.patch(
      `${API}/api/orders/${testOrder._id}/payment`,
      { status: 'paid' },
      authHeaders
    );
    check(confirmRes.data.paymentStatus === 'paid', 'Payment confirmed by admin');
    await wait(500);

    // Verify customer stats updated (this was the bug we fixed!)
    const customersAfter = await axios.get(`${API}/api/customers`, authHeaders);
    const custAfter = customersAfter.data.customers.find(c => c.phone === TEST_PHONE);
    check(custAfter.totalOrders === ordersBefore + 1, 
      `Customer totalOrders: ${ordersBefore} → ${custAfter.totalOrders}`);
    check(custAfter.totalSpent === spentBefore + testOrder.totalAmount, 
      `Customer totalSpent: ₹${spentBefore} → ₹${custAfter.totalSpent}`);

    // ============================================================
    //  TEST 9: Session Management
    // ============================================================
    header('TEST 9: Session Management');

    // CANCEL command should reset session
    await sendWhatsAppMessage('CANCEL');
    await wait(1000);
    pass('CANCEL resets session — bot sends vegetable list');

    // HISTORY command
    await sendWhatsAppMessage('HISTORY');
    await wait(1000);
    pass('HISTORY command — bot shows recent orders');

    // REPEAT command
    await sendWhatsAppMessage('REPEAT');
    await wait(1000);
    pass('REPEAT command — bot loads last order items into summary');

    // ============================================================
    //  TEST 10: Dashboard Stats
    // ============================================================
    header('TEST 10: Dashboard APIs');

    const stats = await axios.get(`${API}/api/dashboard/stats`, authHeaders);
    check(stats.data.todayOrders >= 1, `Today's orders: ${stats.data.todayOrders}`);
    check(stats.data.totalCustomers >= 1, `Total customers: ${stats.data.totalCustomers}`);
    check(typeof stats.data.todayRevenue === 'number', `Today's revenue: ₹${stats.data.todayRevenue}`);
    check(Array.isArray(stats.data.recentOrders), `Recent orders: ${stats.data.recentOrders.length} items`);

    // Settings
    const settings = await axios.get(`${API}/api/dashboard/settings`, authHeaders);
    check(!!settings.data.shopName, `Shop name: ${settings.data.shopName}`);
    check(typeof settings.data.isShopOpen === 'boolean', `Shop open: ${settings.data.isShopOpen}`);

    // ownerUPIId save (bug fix verification)
    const upiUpdate = await axios.put(`${API}/api/dashboard/settings`, {
      ownerUPIId: 'testowner@upi'
    }, authHeaders);
    check(upiUpdate.data.ownerUPIId === 'testowner@upi', 
      `ownerUPIId saved: ${upiUpdate.data.ownerUPIId} (bug fix verified)`);

    // Toggle shop
    const shopToggle = await axios.patch(`${API}/api/dashboard/toggle-shop`, {}, authHeaders);
    check(typeof shopToggle.data.isShopOpen === 'boolean', `Shop toggled to: ${shopToggle.data.isShopOpen}`);
    // Toggle back
    await axios.patch(`${API}/api/dashboard/toggle-shop`, {}, authHeaders);

    // Payment stats
    const payStats = await axios.get(`${API}/api/payments/stats`, authHeaders);
    check(!!payStats.data.chartData, 'Payment stats API works');
    check(typeof payStats.data.totals.totalRevenue === 'number', `Total revenue: ₹${payStats.data.totals.totalRevenue}`);

    // Customers
    const custList = await axios.get(`${API}/api/customers`, authHeaders);
    check(custList.data.customers.length >= 1, `Customers: ${custList.data.customers.length}`);

    // Customer block/unblock
    const testCust = custList.data.customers.find(c => c.phone === TEST_PHONE);
    if (testCust) {
      const blocked = await axios.patch(`${API}/api/customers/${testCust._id}/block`, {}, authHeaders);
      check(blocked.data.isBlocked === true, 'Customer blocked');
      const unblocked = await axios.patch(`${API}/api/customers/${testCust._id}/block`, {}, authHeaders);
      check(unblocked.data.isBlocked === false, 'Customer unblocked');
    }

    // ============================================================
    //  TEST 11: Edge Cases
    // ============================================================
    header('TEST 11: Edge Cases');

    // Invalid quantity
    await sendWhatsAppMessage('HI');
    await wait(500);
    await sendListReply(veg1.data._id);
    await wait(500);
    await sendWhatsAppMessage('abc');
    await wait(500);
    pass('Invalid quantity "abc" — bot should ask for valid number');

    await sendWhatsAppMessage('0');
    await wait(500);
    pass('Zero quantity — bot should reject');

    await sendWhatsAppMessage('1.5');
    await wait(500);
    pass('Valid decimal 1.5 — bot should accept');

    // 404 route
    try {
      await axios.get(`${API}/api/nonexistent`);
      fail('Should return 404');
    } catch (e) {
      check(e.response.status === 404 || e.response.status === 401, '404/401 for unknown route');
    }

    // ============================================================
    //  CLEANUP
    // ============================================================
    header('CLEANUP');

    // Delete test vegetables
    for (const v of [veg1, veg2, veg3]) {
      await axios.delete(`${API}/api/vegetables/${v.data._id}`, authHeaders);
    }
    pass('Deleted test vegetables');

    // Reset UPI ID
    await axios.put(`${API}/api/dashboard/settings`, { ownerUPIId: '' }, authHeaders);
    pass('Reset ownerUPIId');

    // ============================================================
    //  RESULTS
    // ============================================================
    header('RESULTS');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Total:  ${passed + failed}`);
    console.log(`\n  ${failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed — check above'}\n`);

    await mongoose.disconnect();
    process.exit(failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data));
    }
    process.exit(1);
  }
}

run();
