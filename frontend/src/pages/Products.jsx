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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const clearPrice = () => { const next = new URLSearchParams(params); next.delete('minPrice'); next.delete('maxPrice'); next.delete('page'); setParams(next, { replace: true }); };
  return <div className="catalog-stage"><div className="catalog-shell">
    <header className="catalog-heading"><div><p className="catalog-kicker">YOUR NEIGHBOURHOOD MARKETPLACE</p><h1>Find your next favourite.</h1><p>Shop local. Reserve online. Pick up in person.</p></div><label className="catalog-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span className="sr-only">Search products</span><input placeholder="Search products, brands and more" value={params.get('keyword') || ''} onChange={e => update('keyword', e.target.value)} /></label></header>
    <nav className="catalog-categories" aria-label="Product categories">{categories.map(c => <button key={c} className={(params.get('category') || 'All') === c ? 'selected' : ''} aria-pressed={(params.get('category') || 'All') === c} onClick={() => update('category', c === 'All' ? '' : c)}>{c === 'All' ? 'All categories' : c}</button>)}</nav>
    <button className="catalog-filter-toggle btn-secondary" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(!filtersOpen)}>{filtersOpen ? 'Hide filters' : 'Filter products'}</button>
    <div className="catalog-layout">
      <aside id="catalog-filters" className={`catalog-sidebar ${filtersOpen ? 'is-open' : ''}`} aria-label="Product filters">
        <section className="filter-block"><div className="filter-title"><h2>Price range</h2><button onClick={clearPrice}>Reset</button></div><p>Find something within your budget.</p><div className="price-fields"><label>Min ₹<input type="number" min="0" aria-label="Minimum price (₹)" placeholder="0" value={params.get('minPrice') || ''} onChange={e => update('minPrice', e.target.value)} /></label><label>Max ₹<input type="number" min="0" aria-label="Maximum price (₹)" placeholder="Any" value={params.get('maxPrice') || ''} onChange={e => update('maxPrice', e.target.value)} /></label></div><label className="range-label">Quick price limit<input aria-label="Quick maximum price" type="range" min="0" max="100000" step="500" value={Math.min(100000, Number(params.get('maxPrice') || 100000))} onChange={e => update('maxPrice', e.target.value)} /></label><div className="range-ends"><span>₹0</span><span>₹1,00,000</span></div></section>
        <section className="filter-block"><h2>Neighbourhood</h2><label className="filter-field">Area or city<input className="input" placeholder="e.g. Kothrud, Pune" value={params.get('area') || ''} onChange={e => update('area', e.target.value)} /></label></section>
        <section className="filter-block"><div className="filter-title"><h2>Local shops</h2><button onClick={() => update('shop', '')}>Reset</button></div><label className="shop-option"><span>All shops</span><input type="radio" name="shop-filter" checked={!params.get('shop')} onChange={() => update('shop', '')} /></label>{shops.map(s => <label className="shop-option" key={s._id}><span><strong>{s.name}</strong><small>{s.area}</small></span><input type="radio" name="shop-filter" checked={params.get('shop') === s._id} onChange={() => update('shop', s._id)} /></label>)}</section>
        <section className="filter-block"><h2>Availability</h2><label className="shop-option"><span>In stock only</span><input type="checkbox" checked={params.get('inStock') === 'true'} onChange={e => update('inStock', e.target.checked ? 'true' : '')} /></label></section>
        <section className="filter-block pickup-info"><span>MADE FOR LOCAL SHOPPING</span><h2>Pick up. Say hello.</h2><p>Reserve from one shop per order. Pay the seller when you collect.</p><div>In-store pickup</div></section>
        <button className="clear-catalog" onClick={() => setParams({})}>Clear all filters</button>
      </aside>
      <section className="catalog-results" aria-label="Product results" aria-busy={loading}>
        <div className="catalog-toolbar"><p aria-live="polite">{loading ? 'Finding local favourites…' : `${total} products found`}</p><label>Sort by<select aria-label="Sort by" value={params.get('sort') || 'newest'} onChange={e => update('sort', e.target.value)}><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option></select></label></div>
        {loading ? <Loader /> : error ? <p role="alert" className="text-red-600">{error}</p> : <>{!products.length ? <div className="catalog-empty"><h2>No products found</h2><p>Try a different neighbourhood, category or price range.</p><button className="btn-primary" onClick={() => setParams({})}>Clear filters</button></div> : <div className="catalog-grid">{products.map(p => <ProductCard key={p._id} product={p} />)}</div>}<Pagination page={page} pages={pages} onPageChange={p => update('page', String(p))} /></>}
      </section>
    </div>
  </div></div>;
}
