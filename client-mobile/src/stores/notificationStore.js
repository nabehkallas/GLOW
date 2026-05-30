import { create } from 'zustand';
import api from '../api/client';

const useNotificationStore = create((set) => ({
  unreadCount: 0,

  fetchCount: async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      set({ unreadCount: res.data.unread_count ?? 0 });
    } catch {}
  },

  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}));

export default useNotificationStore;
