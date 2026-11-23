import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import StarRating from './StarRating';

const price = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export default function ProductCard({ product }) {
  const { addToCart, isInCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const inCart = isInCart(product._id);
  const discounted = product.discountPrice != null && product.discountPrice < product.price;
  const add = async () => { setAdding(true); try { await addToCart(product._id, 1); } finally { setAdding(false); } };
  return <article className="product-card shop-product">
    <div className="product-media">
      <Link to={`/products/${product._id}`} tabIndex={-1} aria-hidden="true"><img src={imgErr || !product.image ? '/images/product-placeholder.svg' : product.image} alt={product.title} onError={() => setImgErr(true)} loading="lazy" /></Link>
      <span className="product-category">{product.category}</span>
      {discounted && <span className="product-discount">{Math.round((1 - product.discountPrice / product.price) * 100)}% off</span>}
      {product.stock === 0 && <span className="product-unavailable">Out of stock</span>}
    </div>
    <div className="product-caption">
      <h3><Link to={`/products/${product._id}`}>{product.title}</Link></h3>
      {product.shop && <p className="product-shop">{product.shop.name}<span>{product.shop.area}</span></p>}
      {product.numReviews > 0 && <StarRating rating={product.ratings} numReviews={product.numReviews} />}
      <div className="product-purchase">
        <div><strong>{price(product.discountPrice ?? product.price)}</strong>{discounted && <del>{price(product.price)}</del>}</div>
        <button onClick={add} disabled={adding || inCart || product.stock === 0} aria-label={inCart ? `${product.title} is in cart` : `Add ${product.title} to cart`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2M9 13h6m-3-3v6"/></svg>{adding ? 'Adding…' : inCart ? 'Added' : 'Add'}
        </button>
      </div>
      <p className="product-pickup">{product.stock > 0 && product.stock <= 5 ? `Only ${product.stock} left · ` : ''}Pay at pickup</p>
    </div>
  </article>;
}
