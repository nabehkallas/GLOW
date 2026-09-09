import api from './axios'

export const getAdminUsers = () =>
  api.get('admin/admin-users').then((r) => r.data.data ?? r.data)

export const createAdminUser = (data) =>
  api.post('admin/admin-users', data).then((r) => r.data.data ?? r.data)

export const updateAdminUser = (id, data) =>
  api.patch(`admin/admin-users/${id}`, data).then((r) => r.data.data ?? r.data)

export const deleteAdminUser = (id) =>
  api.delete(`admin/admin-users/${id}`)
