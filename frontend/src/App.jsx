




import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';
import AdminLayout from './components/AdminLayout';


const Shops = lazy(() => import('./pages/Shops'));
const Seller = lazy(() => import('./pages/Seller'));
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


const AdminDashboard    = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts     = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm  = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminOrders       = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'));


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader fullScreen />;
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader fullScreen />;
  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (!isAdmin) return (
    <div className="container-custom py-16 text-center">
      <h1 className="page-title">Administrator access required</h1>
      <p className="my-4 text-gray-500">Your customer account cannot access store management.</p>
      <Link to="/admin/login" className="btn-primary">Sign in with an admin account</Link>
    </div>
  );
  return <AdminLayout>{children}</AdminLayout>;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};


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

            <Route path="/shops" element={<Shops />} />
            <Route path="/shops/:id" element={<Shops />} />
            <Route path="/seller" element={<ProtectedRoute><Seller /></ProtectedRoute>} />
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
            <Route path="/admin/login"            element={<Login adminMode />} />
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
