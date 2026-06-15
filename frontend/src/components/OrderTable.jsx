import { CheckCircle, Truck, Clock, Eye } from 'lucide-react';

export default function OrderTable({ orders, onViewOrder, onMarkDelivered }) {
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  }

  function getPaymentBadge(status) {
    switch (status) {
      case 'paid':
        return <span className="badge-success">✅ Paid</span>;
      case 'screenshot_received':
        return <span className="badge-warning font-bold ring-2 ring-amber-400">📸 Verify Pic</span>;
      case 'awaiting_screenshot':
        return <span className="badge-info">⏳ Waiting Pic</span>;
      case 'pending':
        return <span className="badge-warning">⏳ Pending</span>;
      case 'failed':
      case 'rejected':
      case 'cancelled':
        return <span className="badge-danger capitalize">❌ {status}</span>;
      case 'expired':
        return <span className="badge-danger font-bold ring-2 ring-red-400">⏱️ Expired</span>;
      default:
        return <span className="badge-info capitalize">{status}</span>;
    }
  }

  function getDeliveryBadge(status) {
    switch (status) {
      case 'delivered':
        return <span className="badge-success">🚚 Delivered</span>;
      case 'processing':
        return <span className="badge-warning">📦 Processing</span>;
      default:
        return <span className="badge-info">{status}</span>;
    }
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <ShoppingCartEmpty />
        <p className="text-gray-400 mt-4 text-lg">No orders found</p>
        <p className="text-gray-300 text-sm">Orders will appear here when customers place them</p>
      </div>
    );
  }

  return (
    <div className="bg-white md:bg-transparent md:border-none md:shadow-none rounded-2xl md:border md:border-gray-100 overflow-hidden md:shadow-sm">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-5">
                  <span className="font-mono text-sm font-semibold text-primary-600">
                    #{order.orderId}
                  </span>
                </td>
                <td className="py-3.5 px-5">
                  <p className="font-medium text-gray-800 text-sm">{order.customerName}</p>
                  <p className="text-xs text-gray-400">{order.customerPhone}</p>
                </td>
                <td className="py-3.5 px-5">
                  <p className="text-sm text-gray-600 max-w-[200px] truncate">
                    {order.items?.map(i => `${i.emoji || ''} ${i.vegetableName}`).join(', ')}
                  </p>
                </td>
                <td className="py-3.5 px-5">
                  <span className="font-semibold text-gray-800">₹{order.totalAmount}</span>
                </td>
                <td className="py-3.5 px-5">{getPaymentBadge(order.paymentStatus)}</td>
                <td className="py-3.5 px-5">{getDeliveryBadge(order.deliveryStatus)}</td>
                <td className="py-3.5 px-5 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="py-3.5 px-5">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onViewOrder?.(order)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {order.deliveryStatus === 'processing' && order.paymentStatus === 'paid' && (
                      <button
                        onClick={() => onMarkDelivered?.(order._id)}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Mark Delivered"
                      >
                        <Truck size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Premium Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {orders.map((order) => (
          <div 
            key={order._id} 
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 active:scale-[0.98] transition-transform flex flex-col gap-3"
            onClick={() => onViewOrder?.(order)}
          >
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className="font-mono text-sm font-bold tracking-tight text-gray-800">#{order.orderId}</span>
              </div>
              <span className="font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">₹{order.totalAmount}</span>
            </div>
            
            <div>
              <p className="text-base text-gray-800 font-semibold">{order.customerName}</p>
              <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                {order.items?.map(i => `${i.emoji || ''} ${i.vegetableName} x${i.quantity}`).join(', ')}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1.5 flex-wrap">
                {getPaymentBadge(order.paymentStatus)}
                {getDeliveryBadge(order.deliveryStatus)}
              </div>
              <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{formatDate(order.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShoppingCartEmpty() {
  return (
    <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
      <span className="text-3xl">🛒</span>
    </div>
  );
}
