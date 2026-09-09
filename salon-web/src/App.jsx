import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import Services from './pages/Services'
import WorkingHours from './pages/WorkingHours'
import Orders from './pages/Orders'
import History from './pages/History'
import Reviews from './pages/Reviews'
import Analytics from './pages/Analytics'
import Clients from './pages/Clients'
import Media from './pages/Media'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Balance from './pages/Balance'
import ProtectedRoute from './components/ProtectedRoute'

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"     element={<Protected><Dashboard /></Protected>} />
        <Route path="/appointments"  element={<Protected><Appointments /></Protected>} />
        <Route path="/services"      element={<Protected><Services /></Protected>} />
        <Route path="/working-hours" element={<Protected><WorkingHours /></Protected>} />
        <Route path="/orders"        element={<Protected><Orders /></Protected>} />
        <Route path="/history"       element={<Protected><History /></Protected>} />
        <Route path="/reviews"       element={<Protected><Reviews /></Protected>} />
        <Route path="/analytics"     element={<Protected><Analytics /></Protected>} />
        <Route path="/clients"       element={<Protected><Clients /></Protected>} />
        <Route path="/media"         element={<Protected><Media /></Protected>} />
        <Route path="/profile"       element={<Protected><Profile /></Protected>} />
        <Route path="/settings"      element={<Protected><Settings /></Protected>} />
        <Route path="/balance"       element={<Protected><Balance /></Protected>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
