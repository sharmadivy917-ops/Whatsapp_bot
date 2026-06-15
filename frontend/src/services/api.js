import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vegbot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vegbot_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// === AUTH ===
export const authAPI = {
  login: (password) => api.post('/api/auth/login', { password }),
  verify: () => api.get('/api/auth/verify'),
};

// === DASHBOARD ===
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getSettings: () => api.get('/api/dashboard/settings'),
  updateSettings: (data) => api.put('/api/dashboard/settings', data),
  toggleShop: () => api.patch('/api/dashboard/toggle-shop'),
};

// === VEGETABLES ===
export const vegetableAPI = {
  getAll: () => api.get('/api/vegetables'),
  create: (data) => api.post('/api/vegetables', data),
  update: (id, data) => api.put(`/api/vegetables/${id}`, data),
  delete: (id) => api.delete(`/api/vegetables/${id}`),
  toggle: (id) => api.patch(`/api/vegetables/${id}/toggle`),
  toggleAll: (available) => api.patch('/api/vegetables/toggle-all', { available }),
};

// === ORDERS ===
export const orderAPI = {
  getAll: (params) => api.get('/api/orders', { params }),
  getById: (id) => api.get(`/api/orders/${id}`),
  markDelivered: (id) => api.patch(`/api/orders/${id}/deliver`),
  export: (params) => api.get('/api/orders/export', { params, responseType: 'blob' }),
  updatePaymentStatus: (id, status) => api.patch(`/api/orders/${id}/payment`, { status }),
};

// === CUSTOMERS ===
export const customerAPI = {
  getAll: (params) => api.get('/api/customers', { params }),
  getOrders: (id) => api.get(`/api/customers/${id}/orders`),
  toggleBlock: (id) => api.patch(`/api/customers/${id}/block`),
};

// === PAYMENTS ===
export const paymentAPI = {
  getAll: (params) => api.get('/api/payments', { params }),
  getStats: (params) => api.get('/api/payments/stats', { params }),
};

export default api;
