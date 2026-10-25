import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { shopService, productService, orderService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Beauty & Personal Care', 'Sports & Outdoors', 'Toys & Games', 'Grocery', 'Other'];
const blankProduct = { title: '', description: '', image: '', category: 'Grocery', brand: '', price: '', stock: '' };
const blankShop = { name: '', description: '', address: '', area: '', city: '', phone: '', hours: '' };
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
function Field({ label, ...props }) { return <label className="label">{label}<input className="input mt-2" {...props} /></label>; }

export default function Seller() {
  const { updateUserState } = useAuth();
  const [shop, setShop] = useState(null);
  const [profile, setProfile] = useState(blankShop);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [product, setProduct] = useState(blankProduct);
  const [codes, setCodes] = useState({});
  const [status, setStatus] = useState('Active');
  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await shopService.mine();
      setShop(data.shop);
      if (data.shop) {
        setProfile(data.shop);
        const [p, o] = await Promise.all([shopService.products(), shopService.orders()]);
        setProducts(p.data.products); setOrders(o.data.orders);
      } else setTab('profile');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const saveShop = async e => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await shopService.save(profile); setShop(data.shop); updateUserState(data.user); toast.success('Shop profile saved'); await load(); setTab('products'); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const saveProduct = async e => {
    e.preventDefault(); setBusy(true);
    const payload = { ...product, price: Number(product.price), stock: Number(product.stock) };
    try {
      if (editing === 'new') await productService.createProduct(payload);
      else await productService.updateProduct(editing, payload);
      setEditing(null); toast.success('Product saved'); await load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const changeOrder = async (order, next) => {
    setBusy(true);
    try { await orderService.updateOrderStatus(order._id, { orderStatus: next, pickupCode: codes[order._id] || '' }); toast.success(`Order ${next.toLowerCase()}`); await load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const toggleProduct = async p => {
    setBusy(true);
    try { await productService.updateProduct(p._id, { isActive: !p.isActive }); await load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  if (loading) return <Loader />;
  return <div className="container-custom py-10">
    <div className="flex flex-wrap justify-between gap-4 items-center mb-8"><div><p className="eyebrow">YOUR LOCAL BUSINESS, ONLINE</p><h1 className="page-title mt-2">{shop ? shop.name : 'Open your neighbourhood shop'}</h1><p className="text-gray-500 mt-2">{shop ? 'Keep your shelves up to date and your pickups moving.' : 'Add your shop details, then list your products. Customers will come to you.'}</p></div>{shop && <Link className="btn-secondary" to={`/shops/${shop._id}`}>View storefront ↗</Link>}</div>
    {error && <div role="alert" className="mb-6 text-red-600">{error} <button onClick={load} className="underline">Retry</button></div>}
    {shop && <><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{[['Active listings', products.filter(p => p.isActive).length], ['New requests', orders.filter(o => o.orderStatus === 'Requested').length], ['Ready for pickup', orders.filter(o => o.orderStatus === 'Ready for pickup').length], ['Collected', orders.filter(o => o.orderStatus === 'Collected').length]].map(([label, value]) => <div className="card p-5" key={label}><p className="text-sm text-gray-500">{label}</p><p className="text-3xl font-bold mt-2">{value}</p></div>)}</div><div className="flex flex-wrap gap-2 mb-8" aria-label="Seller sections">{[['orders', 'Pickup orders'], ['products', 'My products'], ['profile', 'Shop profile']].map(([key, label]) => <button key={key} onClick={() => { setTab(key); setEditing(null); }} className={tab === key ? 'btn-primary' : 'btn-secondary'}>{label}</button>)}<button onClick={load} className="btn-ghost ml-auto">Refresh</button></div></>}
    {tab === 'profile' && <form onSubmit={saveShop} className="card p-6 max-w-3xl space-y-5"><h2>Shop details</h2><p className="text-sm text-gray-500">These contact and location details are public. Enter the address where customers should collect their orders.</p><div className="grid sm:grid-cols-2 gap-5">{[['name','Shop name',80],['phone','Shop phone',20],['address','Full pickup address',200],['area','Area / neighbourhood',80],['city','City',80],['hours','Pickup hours (e.g. Mon–Sat, 9 am–8 pm)',100]].map(([key,label,max]) => <Field key={key} label={label} required maxLength={max} value={profile[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} />)}</div><label className="label">About your shop<textarea className="input mt-2" rows={3} maxLength={600} value={profile.description} onChange={e => setProfile({ ...profile, description: e.target.value })} /></label><button disabled={busy} className="btn-primary">{busy ? 'Saving…' : shop ? 'Save shop profile' : 'Create my shop'}</button></form>}
    {tab === 'products' && shop && <>
      <div className="flex justify-between mb-5"><h2>Your products</h2><button className="btn-primary" onClick={() => { setProduct(blankProduct); setEditing('new'); }}>+ Add product</button></div>
      {editing && <form onSubmit={saveProduct} className="card p-6 space-y-5 mb-8"><h3>{editing === 'new' ? 'Add a product' : 'Edit product'}</h3><div className="grid sm:grid-cols-2 gap-5"><Field label="Product name" required maxLength={120} value={product.title} onChange={e => setProduct({ ...product, title: e.target.value })} /><label className="label">Category<select className="input mt-2" value={product.category} onChange={e => setProduct({ ...product, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><Field label="Selling price (₹, final price)" type="number" min="0" step="0.01" required value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} /><Field label="Available quantity" type="number" min="0" step="1" required value={product.stock} onChange={e => setProduct({ ...product, stock: e.target.value })} /><Field label="Product image URL" type="text" pattern="(https?://.*|/.*)" title="Use an https:// URL or a local path starting with /" required value={product.image} onChange={e => setProduct({ ...product, image: e.target.value })} /><Field label="Brand (optional)" value={product.brand} onChange={e => setProduct({ ...product, brand: e.target.value })} /></div><label className="label">Description (include size, weight or pack quantity)<textarea className="input mt-2" required maxLength={2000} rows={3} value={product.description} onChange={e => setProduct({ ...product, description: e.target.value })} /></label><div className="flex gap-3"><button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save product'}</button><button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button></div></form>}
      {!products.length && <div className="card p-10 text-center text-gray-500">Your shelves are ready. Add your first product to get discovered.</div>}
      <div className="space-y-3">{products.map(p => <div key={p._id} className="card p-4 flex flex-wrap gap-4 items-center"><img alt={p.title} src={p.image} className="w-16 h-16 rounded-lg object-cover" /><div className="flex-1 min-w-40"><p className="font-semibold">{p.title}</p><p className="text-sm text-gray-500">{money(p.discountPrice ?? p.price)} · {p.stock} available · {p.isActive ? 'Listed' : 'Hidden'}</p></div><button className="btn-secondary" onClick={() => { setProduct({ ...p, price: p.discountPrice ?? p.price, discountPrice: null }); setEditing(p._id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button><button disabled={busy} className="btn-ghost" onClick={() => toggleProduct(p)}>{p.isActive ? 'Hide listing' : 'Publish listing'}</button></div>)}</div>
    </>}
    {tab === 'orders' && shop && <>
      <div className="flex flex-wrap justify-between gap-3 mb-6"><h2>Pickup queue</h2><label className="text-sm">Show <select className="input inline-block w-auto ml-2" value={status} onChange={e => setStatus(e.target.value)}>{['Active','All','Requested','Confirmed','Ready for pickup','Collected','Cancelled'].map(s => <option key={s}>{s}</option>)}</select></label></div>
      <p className="text-sm text-gray-500 mb-5">Confirm availability, prepare the order, then mark it ready. At collection, check the customer’s pickup code and receive payment before completing the order.</p>
      <div className="space-y-5">{orders.filter(o => status === 'All' || (status === 'Active' ? !['Collected','Cancelled'].includes(o.orderStatus) : o.orderStatus === status)).map(o => <div className="card p-6" key={o._id}><div className="flex justify-between gap-3 flex-wrap"><div><h3 className="text-base">{o.pickup.customerName} <span className="text-gray-400 text-xs">#{o._id.slice(-8)}</span></h3><p className="text-sm text-gray-500 mt-1">{o.pickup.customerPhone} · Requested pickup: {o.pickup.requestedDate}</p></div><span className="badge-blue self-start">{o.orderStatus}</span></div><div className="my-4 text-sm space-y-1">{o.items.map(i => <p key={i.product}>{i.quantity} × {i.title} <span className="text-gray-500">— {money(i.price * i.quantity)}</span></p>)}</div>{o.pickup.note && <p className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 text-sm">Customer note: {o.pickup.note}</p>}<p className="font-bold mb-4">{money(o.totalPrice)} · {o.paymentStatus === 'Paid' ? 'Payment received' : 'Collect payment at shop'}</p><div className="flex flex-wrap gap-3 items-center">{o.orderStatus === 'Requested' && <button disabled={busy} className="btn-primary" onClick={() => changeOrder(o, 'Confirmed')}>Confirm order</button>}{o.orderStatus === 'Confirmed' && <button disabled={busy} className="btn-primary" onClick={() => changeOrder(o, 'Ready for pickup')}>Mark ready for pickup</button>}{o.orderStatus === 'Ready for pickup' && <><label className="text-sm">Customer’s pickup code<input className="input mt-1 w-48" maxLength={8} value={codes[o._id] || ''} onChange={e => setCodes({ ...codes, [o._id]: e.target.value })} /></label><button disabled={busy || !codes[o._id]} className="btn-primary" onClick={() => changeOrder(o, 'Collected')}>Payment received & collected</button></>}{!['Cancelled','Collected'].includes(o.orderStatus) && <button disabled={busy} className="btn-secondary text-red-600" onClick={() => { if (window.confirm('Cancel this order and release its reserved stock?')) changeOrder(o, 'Cancelled'); }}>Cancel order</button>}</div></div>)}</div>
      {!orders.filter(o => status === 'All' || (status === 'Active' ? !['Collected','Cancelled'].includes(o.orderStatus) : o.orderStatus === status)).length && <div className="card p-12 text-center text-gray-500">No orders in this view yet. New pickup requests will appear here.</div>}
    </>}
  </div>;
}
