import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './constants';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // authStore will detect the missing token on next check
    }
    return Promise.reject(err);
  }
);

export default api;
