import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  salon: null,
  token: localStorage.getItem('token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, salon: user.salon ?? null, token })
  },

  setUser: (user) => set({ user, salon: user.salon ?? null }),

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, salon: null, token: null })
  },
}))

export default useAuthStore
