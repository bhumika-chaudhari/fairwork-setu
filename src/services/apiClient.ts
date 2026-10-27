import axios from 'axios';
import { getAuthToken } from '../lib/supabaseClient';

const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
const isPlaceholder = !rawApiUrl || rawApiUrl.includes('<') || rawApiUrl.includes('your-render') || rawApiUrl.includes('placeholder');
const BASE_URL = (
  !isPlaceholder
    ? rawApiUrl
    : typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000/api'
    : '/api'
).replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Non-blocking fallback for offline/guest mode
    }
    return config;
  },
  (error) => Promise.reject(error)
);
