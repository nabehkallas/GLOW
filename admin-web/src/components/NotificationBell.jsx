import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { getNotifications, getUnreadCount, markAllRead, markRead } from '../api/notifications'

function routeForNotification(data) {
  switch (data?.type) {
    case 'salon_pending_approval':
    case 'salon_approved':
    case 'salon_rejected':
      return data.salon_id ? `/salons/${data.salon_id}` : '/salons'
    case 'new_order_placed':
    case 'order_return_requested':
    case 'order_cancellation_requested':
      return data.order_type === 'b2c' ? '/client-orders' : '/orders'
    default:
      return null
  }
}

function notificationText(t, data) {
  switch (data?.type) {
    case 'salon_pending_approval':
      return t('notifications.messages.salon_pending_approval', { name: data.salon_name })
    case 'salon_approved':
      return t('notifications.messages.salon_approved', { name: data.salon_name })
    case 'salon_rejected':
      return t('notifications.messages.salon_rejected', { name: data.salon_name, reason: data.reason })
    case 'new_order_placed':
      return t('notifications.messages.new_order_placed', {
        orderType: t(data.order_type === 'b2c' ? 'notifications.orderTypeShop' : 'notifications.orderTypeRestock'),
        id: data.order_id,
        name: data.name,
      })
    default:
      return data?.message ?? null
  }
}

export default function NotificationBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 15000)
    window.addEventListener('push-received', fetchUnreadCount)
    return () => {
      clearInterval(interval)
      window.removeEventListener('push-received', fetchUnreadCount)
    }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchUnreadCount = () => {
    getUnreadCount().then(({ data }) => setUnread(data.unread_count)).catch(() => {})
  }

  const handleOpen = async () => {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    try {
      const { data } = await getNotifications()
      const list = data.data ?? data
      setNotifications(list)
      if (list.some((n) => !n.read_at)) {
        markAllRead().catch(() => {})
        setUnread(0)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (n) => {
    if (!n.read_at) {
      await markRead(n.id).catch(() => {})
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    }
    const route = routeForNotification(n.data)
    if (route) {
      setOpen(false)
      navigate(route)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        title={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">{t('notifications.title')}</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-6">{t('common.loading')}</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">{t('notifications.empty')}</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read_at ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className={`text-sm ${!n.read_at ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {notificationText(t, n.data) ?? t('notifications.new')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
