import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService, shopService } from '../services';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
const categories = ['All','Electronics','Fashion','Home & Kitchen','Books','Beauty & Personal Care','Sports & Outdoors','Toys & Games','Grocery','Other'];
export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const query = params.toString();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const update = (key, value) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); setParams(next, { replace: true }); };
  useEffect(() => { shopService.list().then(({ data }) => setShops(data.shops)).catch(() => {}); }, []);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    const timer = setTimeout(() => {
      productService.getProducts({ ...Object.fromEntries(new URLSearchParams(query)), limit: 12 })
        .then(({ data }) => { if (active) { setProducts(data.products); setTotal(data.total); setPages(data.pages); } })
        .catch(e => { if (active) setError(e.message); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);
  return <div className="container-custom py-10"><p className="eyebrow">DISCOVER WHAT’S AROUND YOU</p><h1 className="page-title mt-2">Explore local products</h1><p className="text-gray-500 mt-2 mb-8">Find your favourite, choose a shop, and collect in person.</p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 card p-5 mb-8"><label className="label">Search products<input className="input mt-2" placeholder="What do you need?" value={params.get('keyword') || ''} onChange={e => update('keyword', e.target.value)} /></label><label className="label">Area or city<input className="input mt-2" placeholder="e.g. Kothrud, Pune" value={params.get('area') || ''} onChange={e => update('area', e.target.value)} /></label><label className="label">Shop<select className="input mt-2" value={params.get('shop') || ''} onChange={e => update('shop', e.target.value)}><option value="">All shops</option>{shops.map(s => <option key={s._id} value={s._id}>{s.name} — {s.area}</option>)}</select></label><label className="label">Category<select className="input mt-2" value={params.get('category') || 'All'} onChange={e => update('category', e.target.value === 'All' ? '' : e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label className="label">Minimum price (₹)<input type="number" min="0" className="input mt-2" value={params.get('minPrice') || ''} onChange={e => update('minPrice', e.target.value)} /></label><label className="label">Maximum price (₹)<input type="number" min="0" className="input mt-2" value={params.get('maxPrice') || ''} onChange={e => update('maxPrice', e.target.value)} /></label><label className="label">Sort by<select className="input mt-2" value={params.get('sort') || 'newest'} onChange={e => update('sort', e.target.value)}><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option></select></label><div className="flex flex-col justify-end gap-2"><label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={params.get('inStock') === 'true'} onChange={e => update('inStock', e.target.checked ? 'true' : '')} />In stock only</label><button className="btn-ghost" onClick={() => setParams({})}>Clear filters</button></div></div>
    {loading ? <Loader /> : error ? <p role="alert" className="text-red-600">{error}</p> : <><p className="text-sm text-gray-500 mb-5">{total} products found · One shop per pickup order</p>{!products.length ? <div className="text-center py-16"><h2>No local finds just yet</h2><p className="text-gray-500 mt-3">Try a different area, category, or price range.</p><button className="btn-primary mt-5" onClick={() => setParams({})}>Clear filters</button></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{products.map(p => <ProductCard key={p._id} product={p} />)}</div>}<Pagination page={page} pages={pages} onPageChange={p => update('page', String(p))} /></>}
  </div>;
}
