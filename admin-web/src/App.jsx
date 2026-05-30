import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Salons from './pages/Salons'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Analytics from './pages/Analytics'
import Cashier from './pages/Cashier'

function RequireAdmin({ children }) {
  const { token, user } = useAuthStore()
  if (!token || user?.role !== 'admin') return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        <Route path="/salons" element={<RequireAdmin><Salons /></RequireAdmin>} />
        <Route path="/products" element={<RequireAdmin><Products /></RequireAdmin>} />
        <Route path="/orders" element={<RequireAdmin><Orders /></RequireAdmin>} />
        <Route path="/analytics" element={<RequireAdmin><Analytics /></RequireAdmin>} />
        <Route path="/cashier"   element={<RequireAdmin><Cashier /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
