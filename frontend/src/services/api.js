import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: import.meta.env.VITE_CMS_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  },
});

// Response Interceptor: Unwrap data and normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalizedError = {
      message: error.response?.data?.message || error.message || 'Unexpected error occurred',
      error: error.response?.data?.error || error.code || 'UNKNOWN_ERROR',
      success: false,
      status: error.response?.status,
    };
    return Promise.reject(normalizedError);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['x-api-key'] = token;
  } else {
    delete api.defaults.headers.common['x-api-key'];
  }
};

export default api;
