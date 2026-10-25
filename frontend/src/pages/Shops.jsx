import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shopService, productService } from '../services';
import ShopCard from '../components/ShopCard';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

export default function Shops() {
  const { id } = useParams();
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setLoading(true); setError('');
    (async () => {
      try {
        if (id) {
          const [s, p] = await Promise.all([shopService.get(id), productService.getProducts({ shop: id, limit: 100 })]);
          setShops([s.data.shop]); setProducts(p.data.products);
        } else setShops((await shopService.list()).data.shops);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);
  return <div className="container-custom py-10">
    <p className="eyebrow">YOUR NEIGHBOURHOOD, ONLINE</p>
    <h1 className="page-title mt-2">{id ? shops[0]?.name || 'Shop' : 'Meet your local shops'}</h1>
    <p className="text-gray-500 mt-3 mb-8">Discover what’s in store. Reserve it here, collect it there.</p>
    {!id && <label className="label max-w-lg mb-8">Find a shop or neighbourhood<input className="input mt-2" placeholder="Shop name, area or city" value={search} onChange={e => setSearch(e.target.value)} /></label>}
    {loading ? <Loader /> : error ? <p role="alert" className="text-red-600">{error}</p> : <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{shops.filter(s => `${s.name} ${s.area} ${s.city}`.toLowerCase().includes(search.toLowerCase())).map(s => <ShopCard key={s._id} shop={s} />)}</div>
      {!id && !shops.filter(s => `${s.name} ${s.area} ${s.city}`.toLowerCase().includes(search.toLowerCase())).length && <p className="py-12 text-gray-500">No shops match your search. Try another area.</p>}
      {id && <><h2 className="mt-12 mb-6">Available at this shop</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{products.map(p => <ProductCard key={p._id} product={p} />)}</div>{!products.length && <p className="text-gray-500">This shop has not listed products yet.</p>}</>}
    </>}
    <div className="mt-12 card p-6 flex flex-wrap items-center justify-between gap-4"><div><h3>Have a shop in your neighbourhood?</h3><p className="text-gray-500 mt-1">Bring your shelves online. Keep the personal connection.</p></div><Link to="/seller" className="btn-primary">Open your shop →</Link></div>
  </div>;
}
