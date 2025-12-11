import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true // For cookies
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject({
        status,
        message: data?.message || 'An error occurred',
        errors: data?.errors || []
      });
    } else if (error.request) {
      // No response received
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.'
      });
    } else {
      // Request setup error
      return Promise.reject({
        status: 500,
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
);

// ====================== NAMED EXPORTS ======================

// Health check
export const checkHealth = () => api.get('/health');

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

// Report services
export const reportService = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (formData) => api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.patch(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
  getNearby: (lat, lng, radius) => api.get('/reports/nearby', { 
    params: { lat, lng, radius } 
  }),
  uploadImages: (id, formData) => api.post(`/reports/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStats: () => api.get('/reports/stats')
};

// ====================== DEFAULT EXPORT ======================
// If you need a default export, add this:
export default api;