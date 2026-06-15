import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { paymentAPI, orderAPI } from '../services/api';
import { toast } from '../components/Toast';

const PERIOD_OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: '✅ Paid' },
  { key: 'pending', label: '⏳ Pending' },
  { key: 'failed', label: '❌ Failed' },
];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ chartData: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [period]);

  async function fetchPayments() {
    try {
      const { data } = await paymentAPI.getAll({ status: statusFilter });
      setPayments(data.payments);
    } catch (error) {
      toast('Failed to load payments', 'error');
    }
    setLoading(false);
  }

  async function fetchStats() {
    try {
      const { data } = await paymentAPI.getStats({ period });
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function handleExport() {
    try {
      const response = await orderAPI.export({});
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Export downloaded! 📥');
    } catch (error) {
      toast('Export failed', 'error');
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'paid':
        return <span className="badge-success">✅ Paid</span>;
      case 'pending':
        return <span className="badge-warning">⏳ Pending</span>;
      case 'failed':
        return <span className="badge-danger">❌ Failed</span>;
      default:
        return <span className="badge-info">{status}</span>;
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-lg font-bold text-primary-600">₹{payload[0]?.value}</p>
          {payload[1] && (
            <p className="text-xs text-gray-400">{payload[1]?.value} orders</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">
          Payments <span className="text-gray-400 text-lg font-normal">/ पेमेंट</span>
        </h1>
        <button id="export-payments-btn" onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download size={16} />
          Export Excel
        </button>
      </div>

      {/* Revenue totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-80">Total Revenue / कुल कमाई</p>
          <p className="text-4xl font-bold mt-1">₹{stats.totals?.totalRevenue || 0}</p>
          <p className="text-sm opacity-60 mt-1">{stats.totals?.totalOrders || 0} total paid orders</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-400">Chart Period</p>
          <div className="flex gap-2 mt-3">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {stats.chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Chart / कमाई चार्ट</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={v => `₹${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payment Status Filters */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === f.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-5 font-mono text-sm font-semibold text-primary-600">#{p.orderId}</td>
                    <td className="py-3 px-5">
                      <p className="text-sm font-medium text-gray-800">{p.customerName}</p>
                      <p className="text-xs text-gray-400">{p.customerPhone}</p>
                    </td>
                    <td className="py-3 px-5 font-semibold text-gray-800">₹{p.totalAmount}</td>
                    <td className="py-3 px-5">{getStatusBadge(p.paymentStatus)}</td>
                    <td className="py-3 px-5 text-sm text-gray-500 capitalize">{p.paymentMethod || '—'}</td>
                    <td className="py-3 px-5 text-sm text-gray-500">{formatDate(p.paidAt || p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Premium Mobile cards */}
          <div className="md:hidden flex flex-col gap-3 p-0 md:p-0">
            {payments.map(p => (
              <div key={p._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 active:scale-[0.98] transition-transform flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    <span className="font-mono text-sm font-bold tracking-tight text-gray-800">#{p.orderId}</span>
                  </div>
                  <span className="font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">₹{p.totalAmount}</span>
                </div>
                <p className="text-base text-gray-800 font-semibold mt-1">{p.customerName}</p>
                <div className="flex items-center justify-between pt-1">
                  {getStatusBadge(p.paymentStatus)}
                  <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{formatDate(p.paidAt || p.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {payments.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <span className="text-4xl block mb-2">💳</span>
              No payments found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
