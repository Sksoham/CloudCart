import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import StarRating from './StarRating';

const formatPrice = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
  </svg>
);

export default function ProductCard({ product }) {
  const { addToCart, isInCart } = useCart();
  const [adding, setAdding]     = useState(false);
  const [imgErr, setImgErr]     = useState(false);

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null;

  const handleAddToCart = async (e) => {
    e.preventDefault(); // prevent navigating to product detail
    setAdding(true);
    await addToCart(product._id, 1);
    setAdding(false);
  };

  const alreadyInCart = isInCart(product._id);

  return (
    <Link to={`/products/${product._id}`} className="group block">
      <div className="card-hover flex flex-col h-full">

        {/* Image container */}
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <img
            src={imgErr ? 'https://via.placeholder.com/400x400.png?text=CloudCart' : product.image}
            alt={product.title}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discountPercent && (
              <span className="badge badge-red text-xs">{discountPercent}% OFF</span>
            )}
            {product.stock === 0 && (
              <span className="badge badge-gray text-xs">Out of Stock</span>
            )}
          </div>

          {/* Quick Add overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0 || alreadyInCart}
              className={`w-full btn text-sm py-2 ${
                alreadyInCart
                  ? 'bg-green-600 text-white cursor-default'
                  : 'btn-primary'
              }`}
            >
              {adding ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding…
                </span>
              ) : alreadyInCart ? (
                '✓ In Cart'
              ) : (
                <span className="flex items-center gap-2">
                  <CartIcon /> Add to Cart
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-1">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wide">
            {product.category}
          </span>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {product.brand && product.brand !== 'Generic' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>
          )}

          <StarRating rating={product.ratings} numReviews={product.numReviews} />

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-auto pt-2">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {formatPrice(product.discountPrice || product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Stock warning */}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Only {product.stock} left!
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
