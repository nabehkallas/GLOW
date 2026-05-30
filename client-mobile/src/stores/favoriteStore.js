import { create } from 'zustand';
import api from '../api/client';

const useFavoriteStore = create((set, get) => ({
  ids: [],

  loadIds: async () => {
    try {
      const res = await api.get('/client/favorites/ids');
      set({ ids: res.data.data ?? [] });
    } catch {}
  },

  toggle: async (salonId) => {
    const { ids } = get();
    const isFav = ids.includes(salonId);
    // Optimistic update
    set({ ids: isFav ? ids.filter((id) => id !== salonId) : [...ids, salonId] });
    try {
      const res = await api.post(`/client/favorites/${salonId}`);
      // Sync with server truth
      if (res.data.favorited && !get().ids.includes(salonId)) {
        set({ ids: [...get().ids, salonId] });
      } else if (!res.data.favorited) {
        set({ ids: get().ids.filter((id) => id !== salonId) });
      }
    } catch {
      // Revert on error
      set({ ids });
    }
  },

  isFavorite: (salonId) => get().ids.includes(salonId),
}));

export default useFavoriteStore;
