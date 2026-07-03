// src/pages/NotFound.jsx
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="text-center max-w-md">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] sm:text-[160px] font-extrabold text-gray-100 dark:text-gray-800 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl sm:text-8xl animate-bounce-slow">🛒</div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Oops! Page not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          The page you're looking for seems to have wandered off. Maybe it's out for delivery?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary btn-lg"
          >
            ← Go Back
          </button>
          <Link to="/" className="btn-primary btn-lg">
            Back to Home
          </Link>
          <Link to="/products" className="btn-accent btn-lg">
            Shop Now
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-400 mb-3">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'Electronics', to: '/products?category=Electronics' },
              { label: 'Fashion',     to: '/products?category=Fashion' },
              { label: 'My Orders',   to: '/orders' },
              { label: 'My Profile',  to: '/profile' },
            ].map(({ label, to }) => (
              <Link key={label} to={to}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
