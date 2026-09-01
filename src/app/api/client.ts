import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
  timeoutErrorMessage: 'Timeout de red — reintentando',
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isAxiosError(err) && !err.response && err.code !== 'ERR_CANCELED') {
      console.warn('[api] network error', err.message);
    }
    return Promise.reject(err);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
