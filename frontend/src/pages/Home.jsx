// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const categories = [
  { name: 'Electronics',           emoji: '📱', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
  { name: 'Fashion',               emoji: '👗', color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300' },
  { name: 'Home & Kitchen',        emoji: '🏠', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
  { name: 'Books',                 emoji: '📚', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
  { name: 'Beauty & Personal Care',emoji: '💄', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
  { name: 'Sports & Outdoors',     emoji: '⚽', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
  { name: 'Toys & Games',          emoji: '🎮', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
  { name: 'Grocery',               emoji: '🛒', color: 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300' },
];

const features = [
  { icon: '🚀', title: 'Fast Delivery',   desc: 'Orders delivered within 2-5 business days across India.' },
  { icon: '🔒', title: 'Secure Payments', desc: 'End-to-end encrypted transactions with multiple payment options.' },
  { icon: '↩️', title: 'Easy Returns',    desc: '30-day hassle-free return policy on all orders.' },
  { icon: '🎧', title: '24/7 Support',    desc: 'Our support team is always available to help you.' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    productService.getProducts({ limit: 8, sort: 'newest' })
      .then(({ data }) => setFeatured(data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?keyword=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-blue-700 dark:from-primary-900 dark:via-primary-800 dark:to-blue-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block mb-4 px-4 py-1.5 bg-white/10 rounded-full text-white/90 text-sm font-medium">
              ☁️ Powered by AWS Cloud Infrastructure
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              Shop Smarter on <span className="text-accent-300">CloudCart</span>
            </h1>
            <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
              Discover thousands of products at unbeatable prices — delivered fast, secured by AWS.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for products, brands..."
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-accent-400 shadow-lg text-sm"
              />
              <button type="submit" className="btn-accent btn-lg rounded-xl shadow-lg px-6">Search</button>
            </form>
            <div className="mt-10 flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              {[['10,000+', 'Products'], ['50,000+', 'Customers'], ['99.9%', 'Uptime']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold text-white">{val}</div>
                  <div>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-custom py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="page-title">Shop by Category</h2>
          <Link to="/products" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${cat.color} hover:scale-105 transition-transform duration-200`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container-custom pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="page-title">Featured Products</h2>
          <Link to="/products" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">See all →</Link>
        </div>
        {loading ? <Loader /> : featured.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
        <div className="mt-10 text-center">
          <Link to="/products" className="btn-primary btn-lg">Browse All Products</Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-100 dark:bg-gray-900 py-16">
        <div className="container-custom">
          <h2 className="page-title text-center mb-12">Why CloudCart?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6 text-center hover:shadow-card-lg transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-custom py-16">
        <div className="rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 p-10 text-center text-white relative overflow-hidden">
          <h2 className="text-3xl font-bold mb-3">Ready to start shopping?</h2>
          <p className="text-accent-100 mb-6 max-w-md mx-auto">Create your free account and get exclusive deals, order tracking, and more.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/register" className="btn bg-white text-accent-600 hover:bg-accent-50 btn-lg font-semibold shadow-lg">Create Free Account</Link>
            <Link to="/products" className="btn border-2 border-white text-white hover:bg-white/10 btn-lg font-semibold">Browse Products</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
