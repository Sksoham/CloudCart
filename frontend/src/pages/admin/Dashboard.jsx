
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService, productService, userService } from '../../services';
import Loader from '../../components/Loader';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const StatCard = ({ title, value, icon, color, sub }) => (
  <div className="card p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>{icon}</div>
    </div>
  </div>
);

const quickLinks = [
  { label: 'Add New Product', to: '/admin/products/new', icon: '➕', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
  { label: 'Manage Products', to: '/admin/products',     icon: '📦', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
  { label: 'View Orders',     to: '/admin/orders',       icon: '🛒', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
  { label: 'Manage Users',    to: '/admin/users',        icon: '👥', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
];

const statusColor = {
  Processing: 'badge-blue', Shipped: 'badge-yellow',
  'Out for Delivery': 'badge-yellow', Delivered: 'badge-green', Cancelled: 'badge-red',
};

export default function Dashboard() {
  const [stats, setStats]             = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount]       = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      orderService.getOrderStats(),
      orderService.getAllOrders({ limit: 5 }),
      productService.getProducts({ limit: 1 }),
      userService.getAllUsers({ limit: 1 }),
    ]).then(([s, o, p, u]) => {
      setStats(s.data.stats);
      setRecentOrders(o.data.orders);
      setProductCount(p.data.total);
      setUserCount(u.data.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with CloudCart.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard title="Total Revenue"  value={fmt(stats?.totalRevenue || 0)}  icon="💰" color="bg-green-50 dark:bg-green-900/20"  sub="From paid orders"/>
        <StatCard title="Total Orders"   value={stats?.totalOrders ?? 0}         icon="📋" color="bg-blue-50 dark:bg-blue-900/20"   sub={`${stats?.pendingOrders ?? 0} pending`}/>
        <StatCard title="Products"       value={productCount}                     icon="🏷️" color="bg-purple-50 dark:bg-purple-900/20" sub="Active listings"/>
        <StatCard title="Customers"      value={userCount}                        icon="👥" color="bg-amber-50 dark:bg-amber-900/20"  sub="Registered users"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Order ID','Customer','Total','Status',''].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No orders yet</td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-3 text-gray-900 dark:text-white">{order.user?.name || 'Unknown'}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">{fmt(order.totalPrice)}</td>
                    <td className="px-6 py-3"><span className={`badge ${statusColor[order.orderStatus] || 'badge-gray'}`}>{order.orderStatus}</span></td>
                    <td className="px-6 py-3">
                      <Link to={`/orders/${order._id}`} className="text-primary-600 dark:text-primary-400 hover:underline text-xs">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          {quickLinks.map((link) => (
            <Link key={link.label} to={link.to}
              className={`flex items-center gap-3 p-4 rounded-xl ${link.color} hover:scale-[1.02] transition-transform`}>
              <span className="text-2xl">{link.icon}</span>
              <span className="font-medium text-sm">{link.label}</span>
              <svg className="w-4 h-4 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          ))}
          <div className="card p-5 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Order Fulfillment</h3>
            <div className="space-y-3">
              {[
                { label: 'Delivered',  value: stats?.deliveredOrders ?? 0, color: 'bg-green-500' },
                { label: 'Processing', value: stats?.pendingOrders   ?? 0, color: 'bg-blue-500'  },
              ].map(({ label, value, color }) => {
                const pct = stats?.totalOrders ? Math.round((value / stats.totalOrders) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{label}</span><span>{value} ({pct}%)</span></div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
