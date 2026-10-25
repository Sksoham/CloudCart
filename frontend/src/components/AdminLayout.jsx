import { Link, NavLink } from 'react-router-dom';

const sections = [
  ['Overview', '/admin'],
  ['Products', '/admin/products'],
  ['Orders', '/admin/orders'],
  ['Users', '/admin/users'],
];

export default function AdminLayout({ children }) {
  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container-custom py-5">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">Store management</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">CloudCart Admin</p>
            </div>
            <Link to="/admin/products/new" className="btn-primary btn-sm">+ Add product</Link>
          </div>
          <nav aria-label="Admin navigation" className="flex flex-wrap gap-2">
            {sections.map(([label, to]) => (
              <NavLink key={to} to={to} end={to === '/admin'}
                className={({ isActive }) => `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>
                {label}
              </NavLink>
            ))}
            <Link to="/" className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">View storefront →</Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
