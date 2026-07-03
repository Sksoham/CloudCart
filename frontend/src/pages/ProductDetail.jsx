// src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../services';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [qty, setQty]             = useState(1);
  const [adding, setAdding]       = useState(false);
  const [imgErr, setImgErr]       = useState(false);

  // Review form
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await productService.getProductById(id);
        setProduct(data.product);
      } catch {
        navigate('/404', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) return <Loader fullScreen />;
  if (!product) return null;

  const effectivePrice   = product.discountPrice || product.price;
  const discountPercent  = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null;
  const alreadyInCart    = isInCart(product._id);

  const handleAddToCart = async () => {
    setAdding(true);
    const ok = await addToCart(product._id, qty);
    setAdding(false);
    if (ok) navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    if (!comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmitting(true);
    try {
      await productService.addReview(product._id, { rating, comment });
      toast.success('Review submitted!');
      const { data } = await productService.getProductById(id);
      setProduct(data.product);
      setRating(0); setComment('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = product.stock === 0
    ? <span className="badge badge-red">Out of Stock</span>
    : product.stock <= 5
    ? <span className="badge badge-yellow">Only {product.stock} left</span>
    : <span className="badge badge-green">In Stock</span>;

  return (
    <div className="container-custom py-10 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary-600">{product.category}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 line-clamp-1">{product.title}</span>
      </nav>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={imgErr ? 'https://via.placeholder.com/600x600.png?text=CloudCart' : product.image}
              alt={product.title}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
              {product.category}
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {product.title}
            </h1>
            {product.brand && product.brand !== 'Generic' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">by {product.brand}</p>
            )}
          </div>

          {/* Rating summary */}
          <div className="flex items-center gap-3">
            <StarRating rating={product.ratings} size="md" />
            <span className="text-sm text-gray-500">
              {product.ratings > 0 ? product.ratings.toFixed(1) : 'No ratings'}{' '}
              ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{fmt(effectivePrice)}</span>
            {product.discountPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">{fmt(product.price)}</span>
                <span className="badge badge-red text-sm">{discountPercent}% OFF</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div>{statusBadge}</div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Quantity + Add to Cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold text-lg">−</button>
                <span className="px-4 py-2 text-gray-900 dark:text-white font-semibold min-w-[48px] text-center">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold text-lg">+</button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding || alreadyInCart}
                className={`flex-1 btn btn-lg ${alreadyInCart ? 'bg-green-600 text-white cursor-default' : 'btn-primary'}`}
              >
                {adding ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Adding…
                  </span>
                ) : alreadyInCart ? '✓ Added to Cart — Go to Cart' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Meta info */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
            {product.sku && <p><span className="font-medium text-gray-700 dark:text-gray-300">SKU:</span> {product.sku}</p>}
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Category:</span> {product.category}</p>
            <p><span className="font-medium text-gray-700 dark:text-gray-300">Brand:</span> {product.brand || 'Generic'}</p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="border-t border-gray-200 dark:border-gray-800 pt-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
          Customer Reviews ({product.numReviews})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Review list */}
          <div className="space-y-4">
            {product.reviews?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
            ) : (
              product.reviews.map((review, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {review.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{review.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Write a review */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Write a Review</h3>
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="label">Your Rating</label>
                  <StarRating rating={rating} size="lg" onSelect={setRating} />
                </div>
                <div>
                  <label className="label">Your Review</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="input resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/500</p>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Please log in to write a review.</p>
                <Link to="/login" className="btn-primary">Log In</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
