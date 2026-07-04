



import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cloudcart_token';
const USER_KEY  = 'cloudcart_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true); // true until initial /me check completes


  const persistAuth = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };


  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authService.getMe();
        persistAuth(data.user, storedToken);
      } catch {

        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    verifyToken();

  }, []);


  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    persistAuth(data.user, data.token);
    toast.success(`Welcome to CloudCart, ${data.user.name}!`);
    return data;
  }, []);

  const login = useCallback(async (formData) => {
    const { data } = await authService.login(formData);
    persistAuth(data.user, data.token);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {

    } finally {
      clearAuth();
      toast.success('Logged out successfully.');
    }
  }, []);

  const updateUserState = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);


  const isAuthenticated = Boolean(user && token);
  const isAdmin         = isAuthenticated && user?.role === 'admin';

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    updateUserState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
