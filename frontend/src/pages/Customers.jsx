import { useState, useEffect } from 'react';
import { Search, ShieldOff, ShieldCheck, ChevronRight, Phone, ShoppingBag, IndianRupee } from 'lucide-react';
import Modal from '../components/Modal';
import { customerAPI } from '../services/api';
import { toast } from '../components/Toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  async function fetchCustomers() {
    try {
      const { data } = await customerAPI.getAll({ search: search || undefined });
      setCustomers(data.customers);
    } catch (error) {
      toast('Failed to load customers', 'error');
    }
    setLoading(false);
  }

  async function handleToggleBlock(id) {
    try {
      await customerAPI.toggleBlock(id);
      toast('Customer status updated');
      fetchCustomers();
    } catch (error) {
      toast('Failed to update', 'error');
    }
  }

  async function viewCustomerHistory(customer) {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    try {
      const { data } = await customerAPI.getOrders(customer._id);
      setCustomerOrders(data.orders);
    } catch (error) {
      toast('Failed to load order history', 'error');
    }
    setOrdersLoading(false);
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">
        Customers <span className="text-gray-400 text-lg font-normal">/ ग्राहक</span>
      </h1>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id="customer-search"
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <span className="text-5xl block mb-3">👥</span>
          <p className="text-gray-500 text-lg">No customers found</p>
          <p className="text-gray-400 text-sm">Customers will appear here after their first order</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((customer, idx) => (
            <div
              key={customer._id}
              className={`bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 stagger-${Math.min(idx + 1, 6)} animate-slide-in-up`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                    customer.isBlocked
                      ? 'bg-gradient-to-br from-red-400 to-red-600'
                      : 'bg-gradient-to-br from-primary-400 to-primary-600'
                  }`}>
                    {(customer.name || 'C')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 truncate">{customer.name || 'Customer'}</h3>
                      {customer.isBlocked && (
                        <span className="badge-danger text-[10px]">Blocked</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {customer.phone}
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <ShoppingBag size={12} />
                        {customer.totalOrders} orders
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <IndianRupee size={12} />
                        ₹{customer.totalSpent}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile stats */}
                <div className="sm:hidden text-right mr-3">
                  <p className="text-sm font-semibold text-gray-700">{customer.totalOrders} orders</p>
                  <p className="text-xs text-gray-400">₹{customer.totalSpent}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBlock(customer._id)}
                    className={`p-2.5 rounded-xl transition-all active:scale-[0.95] ${
                      customer.isBlocked
                        ? 'bg-red-50 hover:bg-green-50 text-red-500 hover:text-green-600'
                        : 'bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500'
                    }`}
                    title={customer.isBlocked ? 'Unblock' : 'Block'}
                  >
                    {customer.isBlocked ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                  </button>
                  <button
                    onClick={() => viewCustomerHistory(customer)}
                    className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all active:scale-[0.95]"
                    title="View History"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Last order info */}
              <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>First order: {formatDate(customer.firstOrderDate)}</span>
                <span>Last order: {formatDate(customer.lastOrderDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Order History Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => { setSelectedCustomer(null); setCustomerOrders([]); }}
        title={`${selectedCustomer?.name || 'Customer'} — Order History`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                {(selectedCustomer.name || 'C')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{selectedCustomer.name}</h3>
                <p className="text-sm text-gray-400">{selectedCustomer.phone}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-bold text-primary-600 text-lg">₹{selectedCustomer.totalSpent}</p>
                <p className="text-xs text-gray-400">{selectedCustomer.totalOrders} orders</p>
              </div>
            </div>

            {ordersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : customerOrders.length === 0 ? (
              <p className="text-center text-gray-400 py-6">No orders found</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {customerOrders.map(order => (
                  <div key={order._id} className="bg-white border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-primary-600">#{order.orderId}</span>
                      <span className="font-semibold">₹{order.totalAmount}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.items?.map(i => `${i.emoji || ''} ${i.vegetableName} x${i.quantity}`).join(', ')}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.deliveryStatus}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
