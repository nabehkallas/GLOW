import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/auth'
import api from '../api/axios'

const links = [
  { to: '/',          label: 'Dashboard'  },
  { to: '/salons',    label: 'Salons'     },
  { to: '/products',  label: 'Products'   },
  { to: '/orders',    label: 'Orders'     },
  { to: '/analytics', label: 'Analytics'  },
  { to: '/cashier',   label: 'Cashier'    },
]

export default function Layout({ children }) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await api.post('auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-prima-dark text-white flex flex-col shrink-0">
        {/* Top gradient accent */}
        <div className="h-0.5 bg-gradient-to-r from-prima-orange to-prima-green" />

        <div className="px-4 pt-5 pb-4 shrink-0 border-b border-white/10 flex flex-col items-center">
          <img src="/Prima-logo.png" alt="Prima" className="h-14 object-contain" />
          <p className="text-xs text-slate-400 mt-2">Admin Panel</p>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-3">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-prima-light">{children}</main>
    </div>
  )
}
