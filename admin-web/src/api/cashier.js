import api from './axios'

export const getCashierSummary = (params = {}) =>
  api.get('admin/cashier/summary', { params }).then((r) => r.data)

export const getCashierTransactions = (params = {}) =>
  api.get('admin/cashier', { params }).then((r) => r.data)

export const getSalonBreakdown = (params = {}) =>
  api.get('admin/cashier/salons', { params }).then((r) => r.data.data)

export const getSalons = () =>
  api.get('admin/salons?status=approved').then((r) => r.data.data ?? r.data)

export const createTransaction = (payload) =>
  api.post('admin/cashier', payload).then((r) => r.data.data)

export const deleteTransaction = (id) =>
  api.delete(`admin/cashier/${id}`)
