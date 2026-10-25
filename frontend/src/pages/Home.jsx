import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService, shopService } from '../services';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    Promise.all([productService.getProducts({ limit: 4, inStock: true }), shopService.list()])
      .then(([p, s]) => { setProducts(p.data.products); setShops(s.data.shops.slice(0, 3)); })
      .catch(e => setError(e.message));
  }, []);
  return <>
    <div className="market-ribbon">A little online discovery. A little neighbourhood love. <span>Browse · Reserve · Pick up</span></div>
    <section className="local-hero">
      <div className="container-custom hero-grid grid lg:grid-cols-2 gap-12 items-center py-14 lg:py-20">
        <div>
          <p className="eyebrow">YOUR NEIGHBOURHOOD, REIMAGINED</p>
          <h1 className="market-headline">Good things.<br />Small shops.<br /><em>Closer to home.</em></h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mt-6 leading-relaxed">Discover products from neighbourhood sellers. Reserve what you love, visit the shop, and pay when you pick it up.</p>
          <form onSubmit={e => { e.preventDefault(); navigate(`/products?${new URLSearchParams({ keyword, area })}`); }} className="market-search mt-8 flex flex-col sm:flex-row gap-3">
            <label className="flex-1 text-xs text-gray-500 px-2">WHAT ARE YOU LOOKING FOR?<input className="input border-0 mt-1" placeholder="Groceries, books, electronics…" value={keyword} onChange={e => setKeyword(e.target.value)} /></label>
            <label className="sm:w-32 text-xs text-gray-500 px-2">YOUR AREA<input className="input border-0 mt-1" placeholder="e.g. Kothrud" value={area} onChange={e => setArea(e.target.value)} /></label>
            <button className="btn-primary px-6">Explore →</button>
          </form>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm text-gray-600 dark:text-gray-400"><span>✓ No delivery fees</span><span>✓ Pay at the shop</span><span>✓ Support local sellers</span></div>
        </div>
        <div className="hero-scene relative max-w-lg w-full mx-auto" aria-hidden="true">
          <div className="local-stamp">LESS SCROLLING<br /><strong>More local.</strong><br />MORE CONNECTION</div><div className="local-art rounded-[2rem] p-8 sm:p-12">
            <div className="flex justify-between text-primary-900 text-xs font-semibold tracking-widest mb-8"><span>THE CORNER SHOP CLUB</span><span>01 / LOCAL</span></div>
            <svg viewBox="0 0 400 280" className="w-full" fill="none">
              <ellipse cx="200" cy="253" rx="170" ry="17" fill="#d9a4b2" />
              <rect x="60" y="80" width="280" height="170" rx="8" fill="#fffdf6" />
              <rect x="81" y="146" width="133" height="86" rx="4" fill="#ead6dc" />
              <rect x="230" y="146" width="86" height="104" rx="4" fill="#9f1239" />
              <rect x="240" y="158" width="65" height="51" rx="3" fill="#d99baa" />
              <circle cx="298" cy="225" r="4" fill="#f4d479" />
              <path d="M55 83H345L327 37H73L55 83Z" fill="#be123c" />
              <path d="M108 37L99 83H143L147 37H108ZM186 37V83H230L225 37H186ZM265 37L275 83H318L305 37H265Z" fill="#fff1f2" />
              <path d="M55 83H99V107C99 132 55 132 55 107V83ZM143 83H186V107C186 132 143 132 143 107V83ZM230 83H275V107C275 132 230 132 230 107V83ZM318 83H345V107C345 132 318 132 318 107V83Z" fill="#be123c" />
              <path d="M99 83H143V107C143 132 99 132 99 107V83ZM186 83H230V107C230 132 186 132 186 107V83ZM275 83H318V107C318 132 275 132 275 107V83Z" fill="#fff1f2" />
              <path d="M91 204H205V211H91Z" fill="#a27644" />
              <rect x="99" y="179" width="21" height="25" rx="4" fill="#eebd57" /><rect x="128" y="169" width="24" height="35" rx="4" fill="#df8360" /><rect x="161" y="184" width="31" height="20" rx="4" fill="#52525b" />
              <rect x="16" y="215" width="32" height="38" rx="5" fill="#b87a54" /><path d="M32 215V158M32 198C10 197 8 175 12 171C31 174 32 190 32 198ZM32 183C52 180 58 164 53 157C35 160 32 172 32 183Z" fill="#52525b" stroke="#52525b" strokeWidth="4" />
            </svg>
            <div className="hero-note bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm text-gray-800"><span className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">✓</span><div><p className="font-semibold">A little closer. A lot more personal.</p><p className="text-xs text-gray-500 mt-1">Found online. Picked up around the corner.</p></div></div>
          </div>
        </div>
      </div>
    </section>
    <section className="container-custom category-section" aria-label="Shop by category"><div className="category-heading"><span className="eyebrow">WHAT’S ON YOUR LIST?</span><Link to="/products">Find your next favourite ↗</Link></div><div className="category-row">{[['Grocery', 'Fresh & everyday', 'vegetables.svg'], ['Books', 'A little inspiration', 'notebook.svg'], ['Fashion', 'Wear your own way', 'tote.svg'], ['Electronics', 'Make life simpler', 'product-placeholder.svg']].map(([category, caption, art]) => <Link to={`/products?category=${encodeURIComponent(category)}`} className="category-tile" key={category}><img src={`/images/${art}`} alt="" /><div><strong>{category}</strong><span>{caption}</span></div><span aria-hidden="true">↗</span></Link>)}</div></section>
    <section className="container-custom py-12"><div className="pickup-steps grid md:grid-cols-3 gap-8">{[['01', 'Find your local favourite', 'Search by product, budget, or neighbourhood. See which shop has what you need.'], ['02', 'Reserve it in a few taps', 'Choose quantities and a pickup date. The seller confirms and prepares your order.'], ['03', 'Drop in. Pick up. Pay.', 'Wait for “Ready for pickup”, show your code at the shop, and pay the seller directly.']].map(([n, title, text]) => <div key={n} className="flex gap-4"><span className="step-number">{n}</span><div><h3 className="text-base">{title}</h3><p className="text-sm text-gray-500 mt-2 leading-relaxed">{text}</p></div></div>)}</div></section>
    <section className="container-custom py-8"><div className="flex justify-between items-end gap-4 mb-7"><div><p className="eyebrow">GOOD FINDS, CLOSE TO HOME</p><h2 className="section-heading mt-2">Fresh finds. Familiar streets.</h2></div><Link to="/products" className="text-sm font-semibold text-primary-600">Explore all →</Link></div>{error && <p role="alert" className="text-red-600">{error}</p>}<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{products.map(p => <ProductCard key={p._id} product={p} />)}</div></section>
    <section className="container-custom py-12"><div className="flex justify-between items-center mb-6"><div><p className="eyebrow mb-2">REAL PEOPLE. LOCAL FAVOURITES.</p><h2 className="section-heading">Meet your neighbourhood.</h2></div><Link to="/shops" className="text-sm font-semibold text-primary-600">All shops →</Link></div><div className="grid md:grid-cols-3 gap-5">{shops.map(s => <ShopCard key={s._id} shop={s} compact />)}</div></section>
    <section className="container-custom pb-16"><div className="seller-banner bg-primary-900 text-white rounded-3xl p-8 sm:p-12 flex flex-wrap justify-between items-center gap-8"><div><p className="text-primary-200 text-xs tracking-widest font-semibold">FOR THE PEOPLE BEHIND THE COUNTER</p><h2 className="section-heading mt-3 text-3xl">Your shop deserves to be discovered.</h2><p className="text-primary-100 mt-3 max-w-xl">List your products, manage pickup requests, and welcome more customers through your door.</p></div><Link to="/seller" className="btn bg-white text-primary-900 hover:bg-primary-50 btn-lg">Start selling locally →</Link></div></section>
  </>;
}
