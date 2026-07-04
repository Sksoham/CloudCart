




import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { cartService } from '../services';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [cart, setCart]           = useState({ items: [], totalItems: 0, totalPrice: 0 });
  const [cartLoading, setCartLoading] = useState(false);


  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {

      setCart({ items: [], totalItems: 0, totalPrice: 0 });
    }

  }, [isAuthenticated]);

  const fetchCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const { data } = await cartService.getCart();
      setCart(data.cart);
    } catch {

    } finally {
      setCartLoading(false);
    }
  }, []);


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


  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const { data } = await cartService.updateCartItem(productId, { quantity });
      setCart(data.cart);
    } catch (err) {
      toast.error(err.message || 'Failed to update quantity.');
    }
  }, []);


  const removeFromCart = useCallback(async (productId) => {
    try {
      const { data } = await cartService.removeFromCart(productId);
      setCart(data.cart);
      toast.success('Item removed from cart.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove item.');
    }
  }, []);


  const clearCart = useCallback(async () => {
    try {
      const { data } = await cartService.clearCart();
      setCart(data.cart);
    } catch {

    }
  }, []);


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
