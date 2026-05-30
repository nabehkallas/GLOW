import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getNotifications, getUnreadCount, markAllRead, markRead } from '../api/notifications'

export default function NotificationBell({ dark = false }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [dropdownPos, setDropdownPos] = useState(null)
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
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

  const calcDropdownPos = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const dropdownWidth = 320
    // Anchor right edge of dropdown to right edge of button; clamp 8px inside viewport
    let left = rect.right - dropdownWidth
    left = Math.max(8, Math.min(left, vw - dropdownWidth - 8))
    setDropdownPos({ top: rect.bottom + 8, left })
  }

  const handleOpen = async () => {
    if (open) { setOpen(false); return }
    calcDropdownPos()
    setOpen(true)
    setLoading(true)
    try {
      const { data } = await getNotifications()
      const list = data.data ?? data
      setNotifications(list.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
      if (list.some((n) => !n.read_at)) {
        markAllRead().catch(() => {})
        setUnread(0)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    await markRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnread((c) => Math.max(0, c - 1))
  }

  const handleMarkAll = async () => {
    await markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setUnread(0)
  }

  return (
    <div ref={wrapperRef}>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`relative p-2 rounded-lg transition-colors ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
        title={t('notifications.title')}
      >
        <svg className={`w-5 h-5 ${dark ? 'text-slate-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && dropdownPos && (
        <div
          className="fixed w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-[200] overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">{t('notifications.title')}</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-gray-400 hover:text-gray-700">
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-6">{t('notifications.loading')}</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">{t('notifications.empty')}</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read_at && handleMarkRead(n.id)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read_at ? 'bg-blue-50' : ''}`}
                >
                  <p className={`text-sm ${!n.read_at ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {n.data?.title ?? n.data?.message ?? t('notifications.new')}
                  </p>
                  {n.data?.body && (
                    <p className="text-xs text-gray-500 mt-0.5">{n.data.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
