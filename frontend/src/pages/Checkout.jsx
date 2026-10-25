import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderService, productService } from '../services';
import ShopCard from '../components/ShopCard';
import Loader from '../components/Loader';

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
const indiaDate = n => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export default function Checkout() {
  const { user } = useAuth();
  const { cart, cartLoading, fetchCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customerName: user?.name || '', customerPhone: user?.phone || '', requestedDate: indiaDate(0), note: '' });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (cartLoading) return;
    let active = true;
    Promise.all((cart?.items || []).map(i => productService.getProductById(i.product)))
      .then(values => { if (active) setProducts(values.map(v => v.data.product)); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cart, cartLoading]);
  const shop = products[0]?.shop;
  const singleShop = shop && products.every(p => p.shop?._id === shop._id);
  const items = cart?.items || [];
  const total = products.reduce((sum, p) => sum + (p.discountPrice ?? p.price) * (items.find(i => i.product === p._id)?.quantity || 0), 0);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const { data } = await orderService.placeOrder(form);
      navigate(`/orders/${data.order._id}`, { replace: true });
      await fetchCart();
    } catch (e) { setError(e.message); setBusy(false); }
  };
  if (loading || cartLoading) return <Loader />;
  if (!items.length) return <div className="container-custom py-20 text-center"><h1 className="page-title">Your pickup basket is empty</h1><Link to="/products" className="btn-primary mt-6">Explore local products</Link></div>;
  return <div className="container-custom py-10"><Link to="/cart" className="text-sm text-primary-600">← Back to basket</Link><h1 className="page-title mt-4">Reserve your pickup</h1><p className="text-gray-500 mt-2 mb-8">No online payment. Your seller will confirm availability and prepare your order.</p>
    <div className="grid lg:grid-cols-2 gap-8"><form onSubmit={submit} className="card p-6 space-y-5"><h2>Your pickup details</h2>{error && <p role="alert" className="text-red-600">{error}</p>}{!singleShop && <p role="alert" className="text-red-600">Your basket must contain products from one shop. Return to your basket and remove items from other shops.</p>}<label className="label">Full name<input className="input mt-2" required minLength={2} maxLength={80} value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></label><label className="label">Contact number<input className="input mt-2" type="tel" required minLength={7} maxLength={20} value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} /></label><label className="label">Preferred pickup date<input className="input mt-2" type="date" required min={indiaDate(0)} max={indiaDate(7)} value={form.requestedDate} onChange={e => setForm({ ...form, requestedDate: e.target.value })} /></label><label className="label">Note to the seller (optional)<textarea className="input mt-2" rows={3} maxLength={500} placeholder="For example: I would like to collect after 5 pm." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label><p className="text-sm text-gray-500">The date is a request, not a guaranteed time slot. Check your order status and wait for “Ready for pickup” before visiting.</p><button disabled={busy || !singleShop || !products.length} className="btn-primary w-full btn-lg">{busy ? 'Reserving…' : `Place pickup order · ${money(total)}`}</button></form>
    <div className="space-y-5">{shop && <ShopCard shop={shop} />}<div className="card p-6"><h2 className="mb-5">Your order</h2>{products.map(p => { const quantity = items.find(i => i.product === p._id)?.quantity || 0; return <div className="flex justify-between gap-3 text-sm py-3 border-b border-gray-100 dark:border-gray-800" key={p._id}><span>{quantity} × {p.title}</span><span className="shrink-0">{money((p.discountPrice ?? p.price) * quantity)}</span></div>; })}<div className="flex justify-between mt-5 text-sm"><span>Pickup fee</span><span className="text-primary-600">Free</span></div><div className="flex justify-between mt-4 text-xl font-bold"><span>Pay at shop</span><span>{money(total)}</span></div><p className="text-xs text-gray-500 mt-4">Listed prices are the final product prices. No shipping charge or additional checkout tax is added. Prices and stock are checked again when you place the order.</p></div></div></div></div>;
}
