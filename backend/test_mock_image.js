const axios = require('axios');

async function testFetch() {
  const login = await axios.post('http://localhost:5000/api/auth/login', { password: 'admin123' });
  const token = login.data.token;
  
  const orders = await axios.get('http://localhost:5000/api/orders?filter=today', { headers: { Authorization: `Bearer ${token}` } });
  
  const order = orders.data.orders.find(o => o.screenshotMediaId && o.screenshotMediaId.startsWith('media_'));
  if (!order) {
    console.log('No test order with screenshot found');
    return;
  }
  
  console.log('Found order:', order.orderId, 'with media:', order.screenshotMediaId);
  
  try {
    const res = await axios.get(`http://localhost:5000/api/orders/${order._id}/screenshot?token=${token}`, { responseType: 'arraybuffer' });
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Bytes:', res.data.length);
  } catch (err) {
    console.log('Error:', err.response?.data?.toString() || err.message);
  }
}

testFetch();
