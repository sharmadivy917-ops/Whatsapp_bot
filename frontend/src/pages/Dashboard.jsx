import { useState, useEffect } from 'react';
import { ShoppingCart, IndianRupee, Users, Package } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import OrderTable from '../components/OrderTable';
import Modal from '../components/Modal';
import api, { dashboardAPI, orderAPI } from '../services/api';
import { toast } from '../components/Toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const { data } = await dashboardAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setLoading(false);
  }

  async function handleMarkDelivered(orderId) {
    try {
      await orderAPI.markDelivered(orderId);
      toast('Order marked as delivered! 🚚');
      fetchStats();
    } catch (error) {
      toast('Failed to update order', 'error');
    }
  }

  async function handleUpdatePayment(orderId, status) {
    try {
      await orderAPI.updatePaymentStatus(orderId, status);
      toast(status === 'paid' ? 'Payment confirmed! ✅' : 'Payment rejected ❌');
      fetchStats();
      setSelectedOrder(null);
    } catch (error) {
      toast('Failed to update payment', 'error');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard <span className="text-gray-400 text-lg font-normal">/ डैशबोर्ड</span></h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">
        Dashboard <span className="text-gray-400 text-lg font-normal">/ डैशबोर्ड</span>
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stagger-1 animate-slide-in-up">
          <StatsCard
            title="Today's Orders / आज के ऑर्डर"
            value={stats?.todayOrders || 0}
            icon={ShoppingCart}
            color="green"
          />
        </div>
        <div className="stagger-2 animate-slide-in-up">
          <StatsCard
            title="Today's Revenue / आज की कमाई"
            value={`₹${stats?.todayRevenue || 0}`}
            icon={IndianRupee}
            color="blue"
          />
        </div>
        <div className="stagger-3 animate-slide-in-up">
          <StatsCard
            title="Total Customers / कुल ग्राहक"
            value={stats?.totalCustomers || 0}
            icon={Users}
            color="purple"
          />
        </div>
        <div className="stagger-4 animate-slide-in-up">
          <StatsCard
            title="Pending Deliveries / बाकी डिलीवरी"
            value={stats?.pendingDeliveries || 0}
            icon={Package}
            color="amber"
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Recent Orders <span className="text-gray-400 font-normal text-sm">/ हाल के ऑर्डर</span>
        </h2>
        <OrderTable
          orders={stats?.recentOrders || []}
          onViewOrder={setSelectedOrder}
          onMarkDelivered={handleMarkDelivered}
        />
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.orderId || ''}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Customer</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
              </div>
              <div>
                <p className="text-gray-400">Phone</p>
                <p className="font-medium">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment</p>
                <p className="font-medium capitalize">{selectedOrder.paymentStatus}</p>
              </div>
              <div>
                <p className="text-gray-400">Delivery</p>
                <p className="font-medium capitalize">{selectedOrder.deliveryStatus}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1.5 text-sm">
                  <span>{item.emoji} {item.vegetableName} × {item.quantity} {item.unit}</span>
                  <span className="font-medium">₹{item.subtotal}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t border-gray-100 font-semibold">
                <span>Total</span>
                <span className="text-primary-600">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            {selectedOrder.screenshotMediaId && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <p className="text-sm font-semibold text-gray-800">📸 Payment Screenshot</p>
                <a
                  href={`${api.defaults.baseURL}/api/orders/${selectedOrder._id}/screenshot?token=${localStorage.getItem('vegbot_token')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary w-full text-center block"
                >
                  View Screenshot in New Tab
                </a>
                
                {selectedOrder.paymentStatus === 'screenshot_received' && (
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button onClick={() => handleUpdatePayment(selectedOrder._id, 'paid')} className="btn-primary flex-1 bg-green-600 hover:bg-green-700 border-none">
                      Confirm Payment
                    </button>
                    <button onClick={() => handleUpdatePayment(selectedOrder._id, 'rejected')} className="btn-primary flex-1 bg-red-600 hover:bg-red-700 border-none">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedOrder.deliveryStatus === 'processing' && selectedOrder.paymentStatus === 'paid' && (
              <button
                onClick={() => {
                  handleMarkDelivered(selectedOrder._id);
                  setSelectedOrder(null);
                }}
                className="btn-primary w-full mt-4"
              >
                Mark Delivered 🚚
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
