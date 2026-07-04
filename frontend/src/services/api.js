




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



api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';


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


    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }


    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;
