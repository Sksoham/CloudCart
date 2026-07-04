
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Cart() {
  const { cart, cartLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const items     = cart?.items || [];
  const subtotal  = cart?.totalPrice ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping  = subtotal > 499 ? 0 : 49;
  const tax       = Number((subtotal * 0.18).toFixed(2));
  const total     = Number((subtotal + shipping + tax).toFixed(2));

  if (cartLoading) {
    return (
      <div className="container-custom py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-24 text-center animate-fade-in">
        <div className="text-7xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary btn-lg">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="page-title">Shopping Cart <span className="text-gray-400 font-normal text-lg">({items.length} item{items.length !== 1 ? 's' : ''})</span></h1>
        <button onClick={clearCart} className="btn-ghost text-sm text-red-500 hover:text-red-600">
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product} className="card p-4 flex gap-4 animate-fade-in">
              {/* Image */}
              <Link to={`/products/${item.product}`} className="flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/96x96.png?text=CC'; }}
                />
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-primary-600 dark:text-primary-400 font-bold mt-1">{fmt(item.price)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Subtotal: {fmt(item.price * item.quantity)}</p>

                <div className="flex items-center justify-between mt-3">
                  {/* Quantity stepper */}
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-2.5 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
                    >−</button>
                    <span className="px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white min-w-[32px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product, item.quantity + 1)}
                      className="px-2.5 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold"
                    >+</button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.product)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : fmt(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Add {fmt(499 - subtotal)} more for free shipping</p>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>GST (18%)</span>
                <span>{fmt(tax)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full btn-lg mt-6"
            >
              Proceed to Checkout
            </button>

            <Link to="/products" className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline mt-4">
              ← Continue Shopping
            </Link>

            {/* Trust badges */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-around text-xs text-gray-400 text-center">
              <div>🔒<br/>Secure</div>
              <div>↩️<br/>30-Day Returns</div>
              <div>🚀<br/>Fast Delivery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
