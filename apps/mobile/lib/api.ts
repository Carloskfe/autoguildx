import axios from 'axios';
import { getToken, clearToken } from './storage';
import { router } from 'expo-router';

export const API_BASE = 'https://autoguildx.com/api/v1';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  },
);

export default api;
