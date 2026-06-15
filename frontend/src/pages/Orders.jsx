import { useState, useEffect } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import OrderTable from '../components/OrderTable';
import Modal from '../components/Modal';
import api, { orderAPI } from '../services/api';
import { toast } from '../components/Toast';

const FILTERS = [
  { key: 'today', label: 'Today / आज' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  useEffect(() => {
    fetchOrders();
  }, [filter, search]);

  async function fetchOrders(page = 1) {
    setLoading(true);
    try {
      const params = { filter: filter === 'all' ? undefined : filter, search: search || undefined, page };
      const { data } = await orderAPI.getAll(params);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      toast('Failed to load orders', 'error');
    }
    setLoading(false);
  }

  async function handleMarkDelivered(orderId) {
    try {
      await orderAPI.markDelivered(orderId);
      toast('Order delivered! 🚚');
      fetchOrders(pagination.page);
    } catch (error) {
      toast('Failed to update', 'error');
    }
  }

  async function handleUpdatePayment(orderId, status) {
    try {
      await orderAPI.updatePaymentStatus(orderId, status);
      toast(status === 'paid' ? 'Payment confirmed! ✅' : 'Payment rejected ❌');
      fetchOrders(pagination.page);
      setSelectedOrder(null);
    } catch (error) {
      toast('Failed to update payment', 'error');
    }
  }

  async function handleExport() {
    try {
      const params = {};
      const now = new Date();
      if (filter === 'today') {
        params.from = now.toISOString().slice(0, 10);
        params.to = now.toISOString().slice(0, 10);
      } else if (filter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.from = weekAgo.toISOString().slice(0, 10);
        params.to = now.toISOString().slice(0, 10);
      } else if (filter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        params.from = monthAgo.toISOString().slice(0, 10);
        params.to = now.toISOString().slice(0, 10);
      }

      const response = await orderAPI.export(params);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Export downloaded! 📥');
    } catch (error) {
      toast('Export failed', 'error');
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">
          Orders <span className="text-gray-400 text-lg font-normal">/ ऑर्डर</span>
        </h1>
        <button id="export-orders-btn" onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download size={16} />
          Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="order-search"
            type="text"
            placeholder="Search by name, phone, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Orders count */}
      <p className="text-sm text-gray-400">
        {pagination.total} order{pagination.total !== 1 ? 's' : ''} found
      </p>

      {/* Order Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <OrderTable
          orders={orders}
          onViewOrder={setSelectedOrder}
          onMarkDelivered={handleMarkDelivered}
        />
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchOrders(page)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                pagination.page === page
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.orderId || ''}`}
        size="md"
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
                <p className="text-gray-400">Date</p>
                <p className="font-medium">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Payment Method</p>
                <p className="font-medium capitalize">{selectedOrder.paymentMethod || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-600">Items</p>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.emoji} {item.vegetableName} × {item.quantity} {item.unit}</span>
                  <span className="font-medium">₹{item.subtotal}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-bold text-primary-700">
                <span>Total</span>
                <span>₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                selectedOrder.paymentStatus === 'screenshot_received' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' :
                selectedOrder.paymentStatus === 'awaiting_screenshot' ? 'bg-blue-100 text-blue-700' :
                selectedOrder.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                Payment: {selectedOrder.paymentStatus}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                selectedOrder.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                Delivery: {selectedOrder.deliveryStatus}
              </span>
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
                className="btn-primary w-full"
              >
                Mark as Delivered 🚚
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
