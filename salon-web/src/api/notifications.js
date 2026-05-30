import api from './axios'

export const getNotifications = () => api.get('/notifications')
export const getUnreadCount = () => api.get('/notifications/unread-count')
export const markRead = (id) => api.patch(`/notifications/${id}/mark-read`)
export const markAllRead = () => api.post('/notifications/mark-all-read')
