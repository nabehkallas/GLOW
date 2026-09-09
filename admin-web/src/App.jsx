import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import useAuthStore from './store/auth'
import api from './api/axios'
import i18n from './i18n'
import { listenForPushMessages } from './services/pushNotifications'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Salons from './pages/Salons'
import SalonDetail from './pages/SalonDetail'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Orders from './pages/Orders'
import ClientOrders from './pages/ClientOrders'
import Analytics from './pages/Analytics'
import SearchTrends from './pages/SearchTrends'
import Cashier from './pages/Cashier'
import Settings from './pages/Settings'

function RequireAdmin({ children }) {
  const { token, user } = useAuthStore()
  if (!token || user?.role !== 'admin') return <Navigate to="/login" replace />
  return children
}

function RequirePermission({ permission, children }) {
  const { user } = useAuthStore()
  const allowed = user?.is_super_admin || user?.permissions?.includes(permission)
  if (!allowed) return <Navigate to="/" replace />
  return <RequireAdmin>{children}</RequireAdmin>
}

function PushNavigator() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => navigate(e.detail.route)
    window.addEventListener('push-navigate', handler)
    return () => window.removeEventListener('push-navigate', handler)
  }, [navigate])

  return null
}

export default function App() {
  const { token, setAuth } = useAuthStore()

  useEffect(() => {
    if (!token) return
    api.get('auth/me').then(({ data }) => setAuth(data.data ?? data, token)).catch(() => {})
    api.patch('auth/locale', { locale: i18n.language }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    listenForPushMessages()
  }, [])

  return (
    <BrowserRouter>
      <PushNavigator />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        <Route path="/salons" element={<RequirePermission permission="salons"><Salons /></RequirePermission>} />
        <Route path="/salons/:id" element={<RequirePermission permission="salons"><SalonDetail /></RequirePermission>} />
        <Route path="/products" element={<RequirePermission permission="products"><Products /></RequirePermission>} />
        <Route path="/products/:id" element={<RequirePermission permission="products"><ProductDetail /></RequirePermission>} />
        <Route path="/orders" element={<RequirePermission permission="orders"><Orders /></RequirePermission>} />
        <Route path="/client-orders" element={<RequirePermission permission="client_orders"><ClientOrders /></RequirePermission>} />
        <Route path="/analytics" element={<RequirePermission permission="analytics"><Analytics /></RequirePermission>} />
        <Route path="/search-trends" element={<RequirePermission permission="analytics"><SearchTrends /></RequirePermission>} />
        <Route path="/cashier"   element={<RequirePermission permission="cashier"><Cashier /></RequirePermission>} />
        <Route path="/settings"  element={<RequireAdmin><Settings /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
