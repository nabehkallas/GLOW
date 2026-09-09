import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home, Building2, Package, ShoppingCart, Store, BarChart3, Banknote, TrendingUp,
  LogOut, Menu, X, Search, ChevronDown, User as UserIcon, Settings as SettingsIcon,
} from 'lucide-react'
import useAuthStore from '../store/auth'
import api from '../api/axios'
import NotificationBell from './NotificationBell'

const NAV_ICONS = {
  '/': Home,
  '/salons': Building2,
  '/products': Package,
  '/orders': ShoppingCart,
  '/client-orders': Store,
  '/analytics': BarChart3,
  '/search-trends': TrendingUp,
  '/cashier': Banknote,
}

export default function Layout({ children }) {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [menuOpen, setMenuOpen] = useState(false)

  const canSee = (permission) => !permission || user?.is_super_admin || user?.permissions?.includes(permission)

  const links = [
    { to: '/',          label: t('nav.dashboard'), permission: null },
    { to: '/salons',    label: t('nav.salons'),    permission: 'salons' },
    { to: '/products',  label: t('nav.products'),  permission: 'products' },
    { to: '/orders',    label: t('nav.orders'),    permission: 'orders' },
    { to: '/client-orders', label: t('nav.clientOrders'), permission: 'client_orders' },
    { to: '/analytics', label: t('nav.analytics'), permission: 'analytics' },
    { to: '/search-trends', label: t('nav.searchTrends'), permission: 'analytics' },
    { to: '/cashier',   label: t('nav.cashier'),   permission: 'cashier' },
  ].filter((l) => canSee(l.permission))

  const pageTitle = location.pathname === '/settings'
    ? t('settings.title')
    : links.find((l) => l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to))?.label

  const handleLogout = async () => {
    try { await api.post('auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  const close = () => setMenuOpen(false)

  const sidebarClosed = isRTL ? 'translate-x-full' : '-translate-x-full'
  const sidebarSide   = isRTL ? 'right-0' : 'left-0'

  return (
    <div className="flex h-screen rtl:flex-row-reverse">

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-prima-dark text-white flex items-center justify-between px-4 py-3 h-14 shadow-md">
        <img src="/Prima-logo.png" alt="Prima" className="h-8 object-contain" />
        <div className="flex items-center gap-3">
          <NotificationBell />
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

        <div className="px-14 pt-0 pb-2 shrink-0 border-b border-white/10 flex flex-col items-center relative">
          <img src="/Prima-logo.png" alt="Prima" className="scale-150 object-contain" />
          <p className="text-xs text-slate-400 mt-2">{t('nav.panelSubtitle')}</p>
          <button onClick={close} className="md:hidden absolute top-2 end-2 text-slate-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-3">
          {links.map(({ to, label }) => {
            const Icon = NAV_ICONS[to]
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
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
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-start text-sm text-slate-300 hover:text-white px-3 py-4 rounded-lg hover:bg-white/10 transition-colors"
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

          <div className="flex items-center gap-4 flex-1 justify-end">
            <HeaderSearch />
            <NotificationBell />
            <ProfileMenu user={user} onLogout={handleLogout} t={t} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-prima-light">{children}</main>
      </div>
    </div>
  )
}

function HeaderSearch() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const runSearch = useCallback((value) => {
    if (value.trim().length < 2) { setResults(null); return }
    api.get('admin/search', { params: { q: value } }).then(({ data }) => setResults(data))
  }, [])

  const onChange = (e) => {
    const value = e.target.value
    setQ(value)
    setOpen(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(value), 300)
  }

  const hasResults = results && (results.salons.length > 0 || results.products.length > 0)

  return (
    <div ref={wrapperRef} className="relative w-64">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 start-3" />
        <input
          value={q}
          onChange={onChange}
          onFocus={() => setOpen(true)}
          placeholder={t('common.search')}
          className="w-full ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/40"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
          {!results ? (
            <p className="text-center text-gray-400 text-xs py-4">{t('common.loading')}</p>
          ) : !hasResults ? (
            <p className="text-center text-gray-400 text-xs py-4">{t('common.noResults')}</p>
          ) : (
            <>
              {results.salons.length > 0 && (
                <div>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('nav.salons')}</p>
                  {results.salons.map((s) => (
                    <Link key={s.id} to={`/salons/${s.id}`} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-gray-50">
                      <span className="font-medium text-prima-dark">{s.name}</span>
                      <span className="text-gray-400 text-xs"> · {s.city}</span>
                    </Link>
                  ))}
                </div>
              )}
              {results.products.length > 0 && (
                <div>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('nav.products')}</p>
                  {results.products.map((p) => (
                    <Link key={p.id} to={`/products/${p.id}`} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-gray-50">
                      <span className="font-medium text-prima-dark">{p.name}</span>
                      {p.category_en && <span className="text-gray-400 text-xs"> · {p.category_en}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ProfileMenu({ user, onLogout, t }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-prima-orange to-prima-green flex items-center justify-center text-white text-xs font-bold shrink-0">
          {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
        </div>
        <span className="hidden lg:block text-sm font-medium text-prima-dark truncate max-w-[120px]">{user?.name ?? '—'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-prima-dark truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/settings') }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-prima-dark transition-colors"
          >
            <SettingsIcon className="w-4 h-4" /> {t('settings.title')}
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
