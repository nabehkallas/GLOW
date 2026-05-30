import api from './axios'

export const getCashierSummary = (date) =>
  api.get('/salon/cashier/summary', { params: date ? { date } : {} }).then((r) => r.data)

export const getCashierTransactions = (filters = {}) =>
  api.get('/salon/cashier', { params: filters }).then((r) => r.data.data)

export const createTransaction = (payload) =>
  api.post('/salon/cashier', payload).then((r) => r.data.data)

export const deleteTransaction = (id) =>
  api.delete(`/salon/cashier/${id}`)
