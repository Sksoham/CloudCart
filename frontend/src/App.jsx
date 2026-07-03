// src/App.jsx
// Defines the complete client-side route tree.
// Protected routes redirect unauthenticated users to /login.
// Admin routes additionally check the 'admin' role.

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';

// ── Lazy-loaded pages (code splitting for faster initial load) ─────────────
const Home          = lazy(() => import('./pages/Home'));
const Products      = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart          = lazy(() => import('./pages/Cart'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const Orders        = lazy(() => import('./pages/Orders'));
const OrderDetail   = lazy(() => import('./pages/OrderDetail'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const Profile       = lazy(() => import('./pages/Profile'));
const NotFound      = lazy(() => import('./pages/NotFound'));

// Admin pages
const AdminDashboard    = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts     = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm  = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminOrders       = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'));

// ── Route Guards ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

// ── App Shell ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<Loader fullScreen />}>
          <Routes>
            {/* Public */}
            <Route path="/"               element={<Home />} />
            <Route path="/products"       element={<Products />} />
            <Route path="/products/:id"   element={<ProductDetail />} />

            {/* Guest only */}
            <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Protected */}
            <Route path="/cart"     element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders"   element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin"                  element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products"         element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/products/new"     element={<AdminRoute><AdminProductForm /></AdminRoute>} />
            <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
            <Route path="/admin/orders"           element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/users"            element={<AdminRoute><AdminUsers /></AdminRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
