
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const ORDER_STATUSES   = ['Processing','Shipped','Out for Delivery','Delivered','Cancelled'];
const PAYMENT_STATUSES = ['Pending','Paid','Failed','Refunded'];

export default function AdminOrders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.orderStatus = statusFilter;
      const { data } = await orderService.getAllOrders(params);
      setOrders(data.orders); setPages(data.pages); setTotal(data.total);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (orderId, orderStatus, paymentStatus) => {
    setUpdating(orderId);
    try {
      const body = {};
      if (orderStatus)   body.orderStatus  = orderStatus;
      if (paymentStatus) body.paymentStatus = paymentStatus;
      await orderService.updateOrderStatus(orderId, body);
      toast.success('Order updated!');
      load();
    } catch (err) { toast.error(err.message || 'Failed to update order'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="container-custom py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total orders</p>
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : orders.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">📋</div><p className="text-gray-500">No orders found.</p></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    {['Order ID','Customer','Date','Total','Order Status','Payment','Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {orders.map((order) => (
                    <>
                      <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3">
                          <button onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                            className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline">
                            #{order._id.slice(-8).toUpperCase()}
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900 dark:text-white text-xs">{order.user?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{order.user?.email}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-5 py-3 font-semibold text-xs text-gray-900 dark:text-white">{fmt(order.totalPrice)}</td>
                        <td className="px-5 py-3">
                          <select value={order.orderStatus} disabled={updating === order._id}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value, null)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none">
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <select value={order.paymentStatus} disabled={updating === order._id}
                            onChange={(e) => handleStatusUpdate(order._id, null, e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none">
                            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          {updating === order._id
                            ? <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"/>
                            : <Link to={`/orders/${order._id}`} className="text-xs text-primary-600 hover:underline">View</Link>}
                        </td>
                      </tr>
                      {expandedId === order._id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/30">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="flex flex-wrap gap-3">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm text-xs">
                                  <img src={item.image} alt={item.title} className="w-8 h-8 rounded object-cover"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/32.png?text=CC'; }}/>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[120px]">{item.title}</p>
                                    <p className="text-gray-400">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              Ship to: {order.shippingAddress?.fullName}, {order.shippingAddress?.city}, {order.shippingAddress?.state}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
