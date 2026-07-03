// src/context/CartContext.jsx
// Provides cart state and actions across the entire app.
// Cart is fetched from the backend on login and kept in sync via API calls.
// Guest users see an empty local cart; it syncs on next login.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { cartService } from '../services';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [cart, setCart]           = useState({ items: [], totalItems: 0, totalPrice: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  // ── Fetch cart from backend whenever auth state changes ────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Clear cart on logout
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const { data } = await cartService.getCart();
      setCart(data.cart);
    } catch {
      // Silently fail — cart simply stays empty
    } finally {
      setCartLoading(false);
    }
  }, []);

  // ── Add item ───────────────────────────────────────────────────────────
  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart.');
      return false;
    }
    try {
      const { data } = await cartService.addToCart({ productId, quantity });
      setCart(data.cart);
      toast.success('Item added to cart!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to add item to cart.');
      return false;
    }
  }, [isAuthenticated]);

  // ── Update quantity ────────────────────────────────────────────────────
  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const { data } = await cartService.updateCartItem(productId, { quantity });
      setCart(data.cart);
    } catch (err) {
      toast.error(err.message || 'Failed to update quantity.');
    }
  }, []);

  // ── Remove single item ─────────────────────────────────────────────────
  const removeFromCart = useCallback(async (productId) => {
    try {
      const { data } = await cartService.removeFromCart(productId);
      setCart(data.cart);
      toast.success('Item removed from cart.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove item.');
    }
  }, []);

  // ── Clear entire cart ──────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    try {
      const { data } = await cartService.clearCart();
      setCart(data.cart);
    } catch {
      // Silently handle
    }
  }, []);

  // ── Derived helpers ────────────────────────────────────────────────────
  const cartCount = cart?.totalItems ?? cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const cartTotal = cart?.totalPrice ??
    cart?.items?.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;

  const isInCart = (productId) =>
    cart?.items?.some((item) => item.product === productId || item.product?._id === productId);

  const value = {
    cart,
    cartLoading,
    cartCount,
    cartTotal,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
