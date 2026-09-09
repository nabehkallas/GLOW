import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home, CalendarDays, Scissors, ShoppingCart, Clock, Users, Image as ImageIcon,
  Star, BarChart3, UserCircle, Globe, LogOut, Menu, X, ChevronDown, User as UserIcon, Settings, History, Wallet,
} from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/auth'
import NotificationBell from './NotificationBell'
import { switchLanguage } from '../i18n'

const NAV_ICONS = {
  '/dashboard':      Home,
  '/appointments':   CalendarDays,
  '/services':       Scissors,
  '/orders':         ShoppingCart,
  '/history':        History,
  '/working-hours':  Clock,
  '/clients':        Users,
  '/media':          ImageIcon,
  '/reviews':        Star,
  '/analytics':      BarChart3,
  '/balance':        Wallet,
  '/profile':        UserCircle,
}

export default function Layout({ children }) {
  const { logout, salon, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isRTL = i18n.language === 'ar'

  const navItems = [
    { to: '/dashboard',     label: t('nav.dashboard')    },
    { to: '/appointments',  label: t('nav.appointments') },
    { to: '/services',      label: t('nav.services')     },
    { to: '/orders',        label: t('nav.orders')       },
    { to: '/history',       label: t('nav.history')      },
    { to: '/working-hours', label: t('nav.workingHours') },
    { to: '/clients',       label: t('nav.clients')       },
    { to: '/media',         label: t('nav.media')         },
    { to: '/reviews',       label: t('nav.reviews')      },
    { to: '/analytics',     label: t('nav.analytics')    },
    ...(salon?.balance_management_enabled ? [{ to: '/balance', label: t('nav.balance') }] : []),
    { to: '/profile',       label: t('nav.profile')      },
  ]

  const pageTitle = navItems.find((l) => location.pathname.startsWith(l.to))?.label

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
    <div className="flex h-screen rtl:flex-row-reverse">

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-prima-dark text-white flex items-center justify-between px-4 py-3 h-14 shadow-md">
        <img src="/Prima-logo.png" alt="Prima" className="h-8 object-contain" />
        <div className="flex items-center gap-3">
          <NotificationBell dark />
          <button onClick={() => setMenuOpen(true)} className="text-slate-300 hover:text-white p-1" aria-label="Open menu">
            <Menu className="w-6 h-6" />
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
          bg-prima-dark text-white flex flex-col shrink-0
          transition-transform duration-200
          ${menuOpen ? 'translate-x-0' : sidebarClosed}
        `}
      >
        <div className="h-0.5 bg-gradient-to-r from-prima-orange to-prima-green shrink-0" />

        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xl font-bold tracking-wide">
              <span className="text-white">Pri</span><span className="text-prima-orange">ma</span>
            </p>
            {salon && <p className="text-xs text-slate-400 mt-0.5 truncate">{salon.name}</p>}
          </div>
          <button onClick={close} className="md:hidden text-slate-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-3">
          {navItems.map(({ to, label }) => {
            const Icon = NAV_ICONS[to]
            return (
              <NavLink
                key={to}
                to={to}
                onClick={close}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold border-e-2 border-prima-green'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-white/10">
          <button
            onClick={handleLangSwitch}
            className="w-full flex items-center gap-2 px-3 pt-4 pb-2 text-start text-xs text-white/60 hover:text-white transition-colors"
          >
            <Globe className="w-3.5 h-3.5" /> {t('lang.switch')}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-start text-sm text-slate-300 hover:text-white px-3 pb-4 pt-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">

        {/* ── Header bar (desktop) ── */}
        <header className="hidden md:flex items-center justify-between gap-4 h-16 px-6 bg-white border-b border-gray-100 shrink-0">
          <h1 className="text-lg font-bold text-prima-dark truncate">{pageTitle}</h1>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <ProfileMenu salon={salon} user={user} onLogout={handleLogout} t={t} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-prima-light">{children}</main>
      </div>
    </div>
  )
}

function ProfileMenu({ salon, user, onLogout, t }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initial = salon?.name ? salon.name.charAt(0).toUpperCase() : null

  return (
    <div ref={wrapperRef} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-prima-orange to-prima-green flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initial ?? <UserIcon className="w-4 h-4" />}
        </div>
        <span className="hidden lg:block text-sm font-medium text-prima-dark truncate max-w-[140px]">{salon?.name ?? '—'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <Link to="/profile" onClick={() => setOpen(false)} className="block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <p className="text-sm font-medium text-prima-dark truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-prima-dark transition-colors">
            <Settings className="w-4 h-4" /> {t('nav.settings')}
          </Link>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors border-t border-gray-100">
            <LogOut className="w-4 h-4" /> {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
