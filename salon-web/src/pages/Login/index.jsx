import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import useAuthStore from '../../store/auth'
import LocationPicker from '../../components/LocationPicker'

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  name:       z.string().min(2),
  email:      z.string().email(),
  password:   z.string().min(8),
  salon_name: z.string().min(2),
  address:    z.string().min(5),
  city:       z.string().min(2),
  phone: z.string().regex(
    /^(\+963|0)9[1-9]\d{7}$/,
    'phone_error'
  ),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
})

export default function Login() {
  const { t } = useTranslation()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.token)

  if (token) return <Navigate to="/dashboard" replace />

  const schema = mode === 'login' ? loginSchema : registerSchema
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const handleLocationChange = (newLat, newLng) => {
    setLat(newLat); setLng(newLng)
    setValue('lat', newLat); setValue('lng', newLng)
  }

  const onSubmit = async (data) => {
    setError('')
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', data)
        if (res.data.user?.role !== 'salon') { setError(t('auth.salonOnly')); return }
        setAuth(res.data.user, res.data.token)
        navigate('/dashboard')
      } else {
        const res = await api.post('/auth/register/salon', { ...data, lat, lng })
        setAuth(res.data.user, res.data.token)
        navigate('/dashboard')
      }
    } catch (e) {
      setError(e.response?.data?.message ?? t('auth.error'))
    }
  }

  const switchMode = (m) => { setMode(m); setError(''); setLat(null); setLng(null) }
  const phoneError = errors.phone ? t('auth.phoneError') : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-prima-light py-8">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100">

        {/* Dark logo header */}
        <div className="bg-prima-dark flex flex-col items-center pb-4">
          <img src="/Prima-logo.png" alt="Prima" className="w-full h-40 md:h-56 object-cover object-center" />
          <p className="text-slate-400 text-xs mt-1 pb-2">{t('auth.salonPortal')}</p>
        </div>

        {/* Form section */}
        <div className="p-8">
          <div className="flex gap-2 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-prima-orange text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m === 'login' ? t('auth.signIn') : t('auth.registerSalon')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('auth.fullName')} error={errors.name?.message}>
                    <input {...register('name')} className={inp} />
                  </Field>
                  <Field label={t('auth.salonName')} error={errors.salon_name?.message}>
                    <input {...register('salon_name')} className={inp} />
                  </Field>
                </div>
                <Field label={t('auth.address')} error={errors.address?.message}>
                  <input {...register('address')} className={inp} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('auth.city')} error={errors.city?.message}>
                    <input {...register('city')} className={inp} />
                  </Field>
                  <Field label={t('auth.phone')} hint={t('auth.syrianNumber')} error={phoneError}>
                    <input {...register('phone')} className={inp} placeholder="0991234567" dir="ltr" />
                  </Field>
                </div>
                <LocationPicker lat={lat} lng={lng} onChange={handleLocationChange} />
              </>
            )}

            <Field label={t('auth.email')} error={errors.email?.message}>
              <input {...register('email')} type="email" className={inp} dir="ltr" />
            </Field>
            <Field label={t('auth.password')} error={errors.password?.message}>
              <input {...register('password')} type="password" className={inp} dir="ltr" />
            </Field>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-prima-orange hover:bg-[#c93d15] text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? t('auth.pleaseWait') : mode === 'login' ? t('auth.signIn') : t('auth.registerAwaitApproval')}
            </button>

            {mode === 'register' && (
              <p className="text-xs text-gray-400 text-center">{t('auth.pendingNote')}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent'
function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-prima-dark mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ms-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
