import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { setError(''); setOrder((await orderService.getOrderById(id)).data.order); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  const cancel = async () => {
    if (!window.confirm('Cancel this pickup order?')) return;
    setBusy(true);
    try { await orderService.updateOrderStatus(id, { orderStatus: 'Cancelled' }); await load(); toast.success('Pickup cancelled'); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  if (loading) return <Loader />;
  if (!order) return <div className="container-custom py-20"><h1 className="page-title">Unable to load order</h1><p role="alert" className="my-4 text-red-600">{error}</p><Link to="/orders" className="btn-secondary">Back to orders</Link></div>;
  const pickup = order.fulfillment === 'pickup';
  const steps = pickup ? ['Requested','Confirmed','Ready for pickup','Collected'] : ['Processing','Shipped','Out for Delivery','Delivered'];
  const step = steps.indexOf(order.orderStatus);
  const p = order.pickup || {};
  const isCustomer = String(order.user?._id || order.user) === String(user?._id || user?.id);
  return <div className="container-custom py-10"><Link to="/orders" className="text-primary-600 text-sm">← My orders</Link><div className="flex justify-between flex-wrap gap-4 my-6"><div><h1 className="page-title">{pickup ? 'Pickup' : 'Order'} #{order._id.slice(-8).toUpperCase()}</h1><p className="text-gray-500 mt-2">{pickup ? p.shopName : 'Delivery order'} · {new Date(order.createdAt).toLocaleDateString('en-IN')}</p></div><button className="btn-secondary" onClick={load}>Refresh status</button></div>{error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
    {order.orderStatus === 'Cancelled' ? <div className="card p-6 mb-6 text-red-600">This order was cancelled. Reserved stock has been released.</div> : <div className="card p-6 mb-6"><div className="grid grid-cols-4 gap-2">{steps.map((s,i) => <div key={s} className="text-center"><div className={`rounded-full w-9 h-9 mx-auto flex items-center justify-center font-bold ${i <= step ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{i < step ? '✓' : i+1}</div><p className="text-xs sm:text-sm mt-3">{s}</p></div>)}</div>{pickup && <p className="mt-6 text-sm text-center text-gray-500">{order.orderStatus === 'Collected' ? 'Collected and paid at the shop. Thank you for shopping locally!' : order.orderStatus === 'Ready for pickup' ? 'Your order is ready! Visit during pickup hours and show your code.' : 'Your request is with the seller. Wait for “Ready for pickup” before visiting.'}</p>}</div>}
    <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6"><div className="card p-6"><h2 className="mb-5">Your items</h2>{order.items.map(i => <div key={i.product} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800"><img src={i.image} alt={i.title} className="w-16 h-16 rounded-lg object-cover" /><div className="flex-1"><Link to={`/products/${i.product}`} className="font-medium">{i.title}</Link><p className="text-sm text-gray-500">{i.quantity} × {money(i.price)}</p></div><span className="font-semibold">{money(i.price * i.quantity)}</span></div>)}</div>
    {pickup ? <div className="card p-6 space-y-3"><h2>Where to collect</h2><p className="font-semibold">{p.shopName}</p><p>{p.address}, {p.area}, {p.city}</p><p className="text-sm text-gray-500">Pickup hours: {p.hours}</p><p className="text-sm">Shop contact: {p.shopPhone}</p><p className="text-sm">Requested date: {p.requestedDate}</p><p className="text-sm">Customer: {p.customerName} · {p.customerPhone}</p>{p.note && <p className="text-sm text-gray-500">Your note: {p.note}</p>}<Link className="text-primary-600 text-sm inline-block" to={`/shops/${order.shop}`}>View shop and directions →</Link></div> : order.shippingAddress && <div className="card p-6"><h2>Delivery address</h2><p className="mt-4">{order.shippingAddress.fullName}<br />{order.shippingAddress.street}<br />{order.shippingAddress.city}</p></div>}</div>
    <div className="space-y-6">{pickup && order.orderStatus !== 'Cancelled' && isCustomer && <div className="card p-6 text-center"><p className="eyebrow">YOUR PICKUP CODE</p><p className="text-3xl tracking-widest font-mono font-bold my-4">{p.code}</p><p className="text-sm text-gray-500">Show this code to the seller when collecting your order.</p></div>}<div className="card p-6"><h2>Payment summary</h2><div className="flex justify-between mt-5 text-sm"><span>Products</span><span>{money(order.itemsPrice)}</span></div><div className="flex justify-between mt-3 text-sm"><span>{pickup ? 'Pickup fee' : 'Shipping'}</span><span>{money(order.shippingPrice)}</span></div>{!pickup && <div className="flex justify-between mt-3 text-sm"><span>Tax</span><span>{money(order.taxPrice)}</span></div>}<div className="flex justify-between mt-5 border-t dark:border-gray-700 pt-4 font-bold text-xl"><span>Total</span><span>{money(order.totalPrice)}</span></div><p className="text-sm text-gray-500 mt-4">{pickup ? 'Pay directly to the seller at collection.' : order.paymentMethod}</p><p className="mt-3 badge-blue">{order.paymentStatus === 'Paid' ? 'Payment received' : 'Payment: ' + order.paymentStatus}</p></div>{pickup && isCustomer && ['Requested','Confirmed'].includes(order.orderStatus) && <button disabled={busy} onClick={cancel} className="btn-secondary w-full text-red-600">Cancel pickup order</button>}</div></div>
  </div>;
}
