import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import useAuthStore from '../store/auth'
import NotificationBell from './NotificationBell'
import { switchLanguage } from '../i18n'

export default function Layout({ children }) {
  const { logout, salon } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isRTL = i18n.language === 'ar'

  const navItems = [
    { to: '/dashboard',     label: t('nav.dashboard')    },
    { to: '/appointments',  label: t('nav.appointments') },
    { to: '/services',      label: t('nav.services')     },
    { to: '/orders',        label: t('nav.orders')       },
    { to: '/working-hours', label: t('nav.workingHours') },
    { to: '/clients',        label: t('nav.clients')       },
    { to: '/media',          label: t('nav.media')         },
    { to: '/reviews',       label: t('nav.reviews')      },
    { to: '/cashier',       label: t('nav.cashier')      },
    { to: '/analytics',     label: t('nav.analytics')    },
    { to: '/profile',       label: t('nav.profile')      },
  ]

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {})
    logout()
    navigate('/login')
  }

  const handleLangSwitch = () => switchLanguage(isRTL ? 'en' : 'ar')
  const close = () => setMenuOpen(false)

  const sidebarClosed = isRTL ? 'translate-x-full' : '-translate-x-full'
  const sidebarSide   = isRTL ? 'right-0' : 'left-0'

  return (
    <div className="flex min-h-screen rtl:flex-row-reverse">

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-prima-dark text-white flex items-center justify-between px-4 py-3 h-14 shadow-md">
        <span className="font-bold text-lg tracking-wide">
          <span className="text-white">Pri</span><span className="text-prima-orange">ma</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLangSwitch}
            className="text-xs text-slate-300 hover:text-white border border-slate-500 rounded px-2 py-0.5 transition-colors"
          >
            {t('lang.switch')}
          </button>
          <NotificationBell dark />
          <button
            onClick={() => setMenuOpen(true)}
            className="text-slate-300 hover:text-white p-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={close} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 ${sidebarSide} h-full z-50 w-64
          md:relative md:z-auto md:w-56 md:h-auto md:translate-x-0
          bg-prima-dark text-white flex flex-col
          transition-transform duration-200
          ${menuOpen ? 'translate-x-0' : sidebarClosed}
        `}
      >
        {/* Top accent line */}
        <div className="h-0.5 bg-gradient-to-r from-prima-orange to-prima-green shrink-0" />

        {/* Sidebar header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xl font-bold tracking-wide">
              <span className="text-white">Pri</span><span className="text-prima-orange">ma</span>
            </p>
            {salon && <p className="text-xs text-slate-400 mt-0.5 truncate">{salon.salon_name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:block"><NotificationBell dark /></span>
            <button onClick={close} className="md:hidden text-slate-300 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              className={({ isActive }) =>
                `block px-6 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold border-e-2 border-prima-green'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10">
          <button
            onClick={handleLangSwitch}
            className="hidden md:block w-full px-6 py-3 text-start text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            🌐 {t('lang.switch')}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 text-start text-sm text-white/70 hover:text-white hover:bg-white/10 border-t border-white/10 transition-colors"
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-prima-light pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
