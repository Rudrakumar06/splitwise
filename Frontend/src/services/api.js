import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('expense_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !['/login', '/register'].includes(window.location.pathname)) {
      localStorage.removeItem('expense_token');
      localStorage.removeItem('expense_user');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export function apiMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error.response?.data?.message || fallback;
}

export default api;
