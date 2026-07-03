// src/pages/Products.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';

const CATEGORIES = [
  'All','Electronics','Fashion','Home & Kitchen','Books',
  'Beauty & Personal Care','Sports & Outdoors','Toys & Games','Grocery','Other',
];
const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [keyword,  setKeyword]  = useState(searchParams.get('keyword')  || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort,     setSort]     = useState(searchParams.get('sort')     || 'newest');
  const [page,     setPage]     = useState(Number(searchParams.get('page')) || 1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (keyword)            params.keyword  = keyword;
      if (category !== 'All') params.category = category;
      if (minPrice)           params.minPrice = minPrice;
      if (maxPrice)           params.maxPrice = maxPrice;
      const { data } = await productService.getProducts(params);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [keyword, category, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    fetchProducts();
    const params = {};
    if (keyword)            params.keyword  = keyword;
    if (category !== 'All') params.category = category;
    if (minPrice)           params.minPrice = minPrice;
    if (maxPrice)           params.maxPrice = maxPrice;
    if (sort !== 'newest')  params.sort     = sort;
    if (page > 1)           params.page     = page;
    setSearchParams(params, { replace: true });
  }, [fetchProducts, keyword, category, minPrice, maxPrice, sort, page, setSearchParams]);

  const go = (setter) => (val) => { setter(val); setPage(1); };
  const clearFilters = () => { setKeyword(''); setCategory('All'); setMinPrice(''); setMaxPrice(''); setSort('newest'); setPage(1); };
  const hasActiveFilters = keyword || category !== 'All' || minPrice || maxPrice;

  const FilterPanel = () => (
    <aside className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Category</h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => go(setCategory)(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === cat ? 'bg-primary-600 text-white font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Price Range (INR)</h3>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={minPrice} onChange={(e) => go(setMinPrice)(e.target.value)} className="input w-1/2" min="0"/>
          <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => go(setMaxPrice)(e.target.value)} className="input w-1/2" min="0"/>
        </div>
      </div>
      {hasActiveFilters && <button onClick={clearFilters} className="btn-secondary w-full text-sm">Clear All Filters</button>}
    </aside>
  );

  return (
    <div className="container-custom py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">
            {category !== 'All' ? category : keyword ? `Results for "${keyword}"` : 'All Products'}
          </h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total} product{total !== 1 ? 's' : ''} found</p>}
        </div>
        <div className="flex items-center gap-3">
          <button className="sm:hidden btn-secondary btn-sm" onClick={() => setMobileFilterOpen((p) => !p)}>
            {mobileFilterOpen ? 'Hide Filters' : 'Filters'}
          </button>
          <select value={sort} onChange={(e) => go(setSort)(e.target.value)} className="input w-auto text-sm">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-6 max-w-lg">
        <input type="text" value={keyword} onChange={(e) => go(setKeyword)(e.target.value)}
          placeholder="Search products..." className="input w-full"/>
      </div>

      <div className="flex gap-8">
        <div className="hidden sm:block w-52 flex-shrink-0"><FilterPanel /></div>

        {mobileFilterOpen && (
          <div className="sm:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileFilterOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 dark:text-white">Filters</h2>
                <button onClick={() => setMobileFilterOpen(false)} className="btn-ghost p-1">X</button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {loading ? <Loader /> : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search term.</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination page={page} pages={pages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
