import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import i18n from '../i18n';
import { registerForPushNotifications } from '../services/pushNotifications';

function syncLocale() {
  api.patch('/auth/locale', { locale: i18n.language }).catch(() => {});
}

const useAuthStore = create((set, get) => ({
  user: null,
  salon: null,
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
      if (user.role !== 'salon') throw new Error('not a salon');
      set({ token, user, salon: user.salon ?? null, isLoading: false });
      registerForPushNotifications();
      syncLocale();
    } catch {
      await AsyncStorage.removeItem('token');
      set({ token: null, user: null, salon: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    if (user.role !== 'salon') throw new Error('not_salon');
    await AsyncStorage.setItem('token', token);
    set({ token, user, salon: user.salon ?? null });
    registerForPushNotifications();
    syncLocale();
  },

  registerSalon: async (payload) => {
    const res = await api.post('/auth/register/salon', payload);
    const { token, user } = res.data;
    await AsyncStorage.setItem('token', token);
    set({ token, user, salon: user.salon ?? null });
    registerForPushNotifications();
    syncLocale();
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.removeItem('token');
    set({ token: null, user: null, salon: null });
  },

  setUser: (user) => set({ user, salon: user.salon ?? get().salon }),

  updateSalon: (partial) => set((s) => ({ salon: s.salon ? { ...s.salon, ...partial } : s.salon })),
}));

export default useAuthStore;
