// src/pages/OrderDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services';
import Loader from '../components/Loader';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_STEPS = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getOrderById(id)
      .then(({ data }) => setOrder(data.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;

  if (!order) {
    return (
      <div className="container-custom py-24 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Order not found</h2>
        <Link to="/orders" className="btn-primary">Back to Orders</Link>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'Cancelled';
  const currentStep = isCancelled ? -1 : STATUS_STEPS.indexOf(order.orderStatus);

  const statusBadgeClass = {
    Processing: 'badge-blue', Shipped: 'badge-yellow',
    'Out for Delivery': 'badge-yellow', Delivered: 'badge-green', Cancelled: 'badge-red',
  }[order.orderStatus] || 'badge-gray';

  const payBadgeClass = {
    Paid: 'badge-green', Pending: 'badge-yellow', Failed: 'badge-red', Refunded: 'badge-gray',
  }[order.paymentStatus] || 'badge-gray';

  return (
    <div className="container-custom py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link to="/orders" className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 block">
            ← Back to Orders
          </Link>
          <h1 className="page-title">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`badge ${statusBadgeClass} text-sm px-3 py-1`}>{order.orderStatus}</span>
          <span className={`badge ${payBadgeClass} text-sm px-3 py-1`}>{order.paymentStatus}</span>
        </div>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Order Progress</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                    ${i <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-2 text-center max-w-[70px] leading-tight
                    ${i <= currentStep ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-400'}`}>
                    {step}
                  </p>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < currentStep ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}/>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
              Items ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                  <img src={item.image} alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/64.png?text=CC'; }}/>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product}`}
                      className="font-medium text-gray-900 dark:text-white text-sm hover:text-primary-600 line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × {fmt(item.price)}</p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm flex-shrink-0">
                    {fmt(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Shipping Address</h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-900 dark:text-white">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Items Price</span><span>{fmt(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : fmt(order.shippingPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>GST (18%)</span><span>{fmt(order.taxPrice)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Total</span><span className="text-lg">{fmt(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Info</h2>
            <div className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Method</span><span className="font-medium text-gray-900 dark:text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`badge ${payBadgeClass}`}>{order.paymentStatus}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span>Paid At</span>
                  <span>{new Date(order.paidAt).toLocaleDateString('en-IN')}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span>Delivered</span>
                  <span>{new Date(order.deliveredAt).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
