import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { registerForPushNotifications } from '../services/pushNotifications';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  init: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data ?? res.data;
      if (user.role !== 'client') throw new Error('not a client');
      set({ token, user, isLoading: false });
      registerForPushNotifications();
    } catch {
      await AsyncStorage.removeItem('token');
      set({ token: null, user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    if (user.role !== 'client') throw new Error('not_client');
    await AsyncStorage.setItem('token', token);
    set({ token, user });
    registerForPushNotifications();
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.removeItem('token');
    set({ token: null, user: null });
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
