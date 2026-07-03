// src/pages/Orders.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const statusBadge = (status) => {
  const map = {
    Processing:       'badge-blue',
    Shipped:          'badge-yellow',
    'Out for Delivery':'badge-yellow',
    Delivered:        'badge-green',
    Cancelled:        'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
};

const paymentBadge = (status) => {
  const map = { Paid: 'badge-green', Pending: 'badge-yellow', Failed: 'badge-red', Refunded: 'badge-gray' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [total, setTotal]   = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await orderService.getMyOrders({ page, limit: 10 });
        setOrders(data.orders);
        setPages(data.pages);
        setTotal(data.total);
      } catch { setOrders([]); }
      finally { setLoading(false); }
    };
    load();
  }, [page]);

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-10 animate-fade-in">
      <h1 className="page-title mb-2">My Orders</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{total} order{total !== 1 ? 's' : ''} total</p>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-7xl mb-6">📦</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No orders yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Start shopping to see your orders here.</p>
          <Link to="/products" className="btn-primary btn-lg">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="card p-5 hover:shadow-card-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(order.orderStatus)}
                    {paymentBadge(order.paymentStatus)}
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex gap-3 mb-4 overflow-x-auto pb-1 no-scrollbar">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-xs">
                      <img src={item.image} alt={item.title}
                        className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40.png?text=CC'; }}/>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[100px]">{item.title}</p>
                        <p className="text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-500">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(order.totalPrice)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">via {order.paymentMethod}</span>
                  </div>
                  <Link to={`/orders/${order._id}`} className="btn-secondary btn-sm">
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
