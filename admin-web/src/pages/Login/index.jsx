import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../store/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, token } = useAuthStore()
  const navigate = useNavigate()

  if (token) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('auth/login', { email, password })
      if (data.user?.role !== 'admin') {
        setError('Access denied. Admin accounts only.')
        return
      }
      setAuth(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-prima-light flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden border border-gray-100">

        {/* Dark logo header */}
        <div className="bg-prima-dark flex flex-col items-center pb-4">
          <img src="/Prima-logo.png" alt="Prima" className="w-full h-40 md:h-56 object-cover object-center" />
          <p className="text-slate-400 text-xs mt-1 pb-2">Management Panel</p>
        </div>

        {/* Form section */}
        <div className="p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-prima-dark mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-prima-dark mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-prima-orange hover:bg-[#c93d15] text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
