import api from './axios'

export const getBalanceSummary = (params = {}) =>
  api.get('salon/balance/summary', { params }).then((r) => r.data)

export const getBalanceHistory = (params = {}) =>
  api.get('salon/balance/history', { params }).then((r) => r.data)

export const getBalanceTransactions = (params = {}) =>
  api.get('salon/balance/transactions', { params }).then((r) => r.data)

export const createBalanceTransaction = (payload) =>
  api.post('salon/balance/transactions', payload).then((r) => r.data.data ?? r.data)

export const deleteBalanceTransaction = (id) =>
  api.delete(`salon/balance/transactions/${id}`)
