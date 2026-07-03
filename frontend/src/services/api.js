// src/services/api.js
// Central Axios instance used by every service module.
// Automatically attaches the JWT from localStorage to every request
// and handles 401 responses by redirecting to login.

import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // send httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s timeout - important for cold EC2 starts
});

// ─── Request Interceptor ──────────────────────────────────────────────────
// Attach the JWT token (stored in localStorage) to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudcart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────
// Normalize error responses and handle expired sessions globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    // 401: session expired or invalid token → force logout
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/register', '/'];

      if (!publicPaths.includes(currentPath)) {
        localStorage.removeItem('cloudcart_token');
        localStorage.removeItem('cloudcart_user');
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    }

    // 403: insufficient permissions
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }

    // 500: server error
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;
