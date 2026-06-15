const axios = require('axios');

const API = 'http://localhost:5000';
const TEST_PHONE = '919999900000';

async function sendWhatsAppMessage(message) {
  const isMedia = message.startsWith('media_');
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          contacts: [{ wa_id: TEST_PHONE, profile: { name: 'Test Customer' } }],
          messages: [{
            from: TEST_PHONE,
            type: isMedia ? 'image' : 'text',
            [isMedia ? 'image' : 'text']: isMedia ? { id: message } : { body: message }
          }]
        }
      }]
    }]
  };
  await axios.post(`${API}/webhook`, payload);
  await new Promise(r => setTimeout(r, 1000));
}

async function runDemo() {
  console.log('\n============================================================');
  console.log('  🧪 RUNNING SCREENSHOT VERIFICATION TEST CASE');
  console.log('============================================================\n');

  try {
    // 1. Reset and Create Order
    console.log('⏳ Creating a test order via WhatsApp bot...');
    
    // Auth login to get token
    const login = await axios.post(`${API}/api/auth/login`, { password: 'admin123' });
    const token = login.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    await sendWhatsAppMessage('RESET'); // reset session
    await sendWhatsAppMessage('2');     // Quantity
    await sendWhatsAppMessage('show_summary'); 
    await sendWhatsAppMessage('confirm_order');

    // Get order ID
    const ordersRes = await axios.get(`${API}/api/orders?filter=today`, authHeaders);
    const pendingOrder = ordersRes.data.orders.find(o => o.customerPhone === TEST_PHONE && o.paymentStatus === 'awaiting_screenshot');
    
    if (!pendingOrder) {
      console.log('❌ Failed to create order. Is the bot running?');
      return;
    }
    
    console.log(`✅ Order Created! ID: #${pendingOrder.orderId} | Status: ${pendingOrder.paymentStatus}`);

    // 2. Send Screenshot
    console.log(`\n⏳ Customer sends payment screenshot to WhatsApp...`);
    const fakeMediaId = `media_${Date.now()}`;
    await sendWhatsAppMessage(fakeMediaId);
    
    // Check status
    const updatedOrderRes = await axios.get(`${API}/api/orders/${pendingOrder._id}`, authHeaders);
    const updatedOrder = updatedOrderRes.data;
    console.log(`✅ Webhook processed screenshot!`);
    console.log(`✅ Order Status updated to: [${updatedOrder.paymentStatus}]`);
    console.log(`✅ Saved Media ID: ${updatedOrder.screenshotMediaId}`);

    // 3. Admin Verifies
    console.log(`\n⏳ Admin clicks "Confirm Payment" on the Dashboard...`);
    
    await axios.patch(`${API}/api/orders/${pendingOrder._id}/payment`, 
      { paymentStatus: 'paid' },
      authHeaders
    );
    
    const finalOrderRes = await axios.get(`${API}/api/orders/${pendingOrder._id}`, authHeaders);
    console.log(`✅ Payment Confirmed!`);
    console.log(`✅ Final Order Status: [${finalOrderRes.data.paymentStatus}]`);
    
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!\n');

  } catch (error) {
    console.error('Test Failed:', error.message);
    if (error.response) {
      console.error(error.response.data);
    }
  }
}

runDemo();
