import api from './axios'

export const getSalon = (id) =>
  api.get(`admin/salons/${id}`).then((r) => r.data.data ?? r.data)

export const getSalonStats = (id, months = 6) =>
  api.get(`admin/salons/${id}/stats`, { params: { months } }).then((r) => r.data)

export const updateSalonPhone = (id, phone) =>
  api.patch(`admin/salons/${id}/phone`, { phone }).then((r) => r.data.data ?? r.data)

export const approveSalon = (id) =>
  api.patch(`admin/salons/${id}/approve`).then((r) => r.data)

export const rejectSalon = (id, reason) =>
  api.patch(`admin/salons/${id}/reject`, { reason }).then((r) => r.data)

export const deleteSalon = (id) =>
  api.delete(`admin/salons/${id}`)
