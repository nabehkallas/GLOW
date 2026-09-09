import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import i18n from '../i18n'
import useAuthStore from '../store/auth'

export function useAuth() {
  const { user, salon, token, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!user && !!token)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    if (user) { setLoading(false); return }

    api.get('/auth/me')
      .then(({ data }) => {
        const me = data.data ?? data
        if (me.role !== 'salon') { logout(); navigate('/login'); return }
        setUser(me)
        setLoading(false)
        api.patch('/auth/locale', { locale: i18n.language }).catch(() => {})
      })
      .catch((err) => {
        if (err.response?.status === 401) { logout(); navigate('/login') }
        else setLoading(false)
      })
  }, [])

  return { user, salon, loading }
}
