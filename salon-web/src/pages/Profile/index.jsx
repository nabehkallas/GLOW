import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { MapPin, ShoppingBag } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/auth'

export default function Profile() {
  const { t } = useTranslation()
  const { setUser, updateSalon } = useAuthStore()
  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting, isDirty } } = useForm()

  const [logoUrl,   setLogoUrl]   = useState(null)
  const [salonName, setSalonName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [productsOrdered, setProductsOrdered] = useState(null)
  const fileRef = useRef()

  const latitude  = watch('latitude')
  const longitude = watch('longitude')

  useEffect(() => {
    api.get('/salon/profile').then(({ data }) => {
      const user = data.data ?? data
      setLogoUrl(user.salon?.logo_url ?? null)
      setSalonName(user.salon?.name ?? '')
      reset({
        salon_name:  user.salon?.name ?? '',
        description: user.salon?.description ?? '',
        address:     user.salon?.address ?? '',
        city:        user.salon?.city ?? '',
        phone:       user.phone ?? '',
        latitude:    user.salon?.latitude ?? '',
        longitude:   user.salon?.longitude ?? '',
        capacity:    user.salon?.capacity ?? 1,
      })
    })
    api.get('/salon/products-ordered').then(({ data }) => setProductsOrdered(data.products ?? []))
  }, [])

  const onSubmit = async (data) => {
    const res = await api.put('/salon/profile', data)
    const user = res.data.data ?? res.data
    setUser(user)
    setSalonName(user.salon?.name ?? '')
    reset({
      salon_name:  user.salon?.name ?? '',
      description: user.salon?.description ?? '',
      address:     user.salon?.address ?? '',
      city:        user.salon?.city ?? '',
      phone:       user.phone ?? '',
      latitude:    user.salon?.latitude ?? '',
      longitude:   user.salon?.longitude ?? '',
      capacity:    user.salon?.capacity ?? 1,
    })
  }

  const handleLogoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res = await api.post('/salon/profile/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.logo_url ?? null
      setLogoUrl(url)
      updateSalon({ logo_url: url })
    } catch {
      alert(t('profile.logoFailed'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const trackLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t('profile.locationUnsupported'))
      return
    }
    setTracking(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude, { shouldDirty: true })
        setValue('longitude', pos.coords.longitude, { shouldDirty: true })
        setTracking(false)
      },
      () => {
        setLocationError(t('profile.locationError'))
        setTracking(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const initial = salonName?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <Layout>
      <div className="p-4 sm:p-8 max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-prima-dark">{t('profile.title')}</h1>

        {/* ── Logo upload ── */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-prima-orange transition-colors flex-shrink-0 focus:outline-none"
            title={t('profile.changeLogo')}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-prima-dark flex items-center justify-center">
                <span className="text-white text-3xl font-black">{initial}</span>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading
                ? <span className="text-white text-xs font-semibold">{t('common.saving')}</span>
                : <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
              }
            </div>
          </button>
          <div>
            <p className="text-sm font-semibold text-prima-dark">{t('profile.salonLogo')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('profile.logoHint')}</p>
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="mt-2 text-xs text-prima-orange hover:underline font-medium disabled:opacity-50"
            >
              {uploading ? t('common.saving') : t('profile.changeLogo')}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>

        {/* ── Profile form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
          <Field label={t('profile.salonName')}><input {...register('salon_name')} className={inp} /></Field>
          <Field label={t('common.description')}><textarea {...register('description')} className={inp} rows={3} /></Field>
          <Field label={t('profile.address')}><input {...register('address')} className={inp} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('profile.city')}><input {...register('city')} className={inp} /></Field>
            <Field label={t('profile.phone')}><input {...register('phone')} className={inp} dir="ltr" /></Field>
          </div>
          <Field label={t('profile.location')}>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={trackLocation}
                disabled={tracking}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-prima-dark text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {tracking ? t('profile.tracking') : t('profile.trackLocation')}
              </button>
              {latitude && longitude ? (
                <span className="text-xs text-gray-500" dir="ltr">{Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}</span>
              ) : (
                <span className="text-xs text-gray-400">{t('profile.locationNotSet')}</span>
              )}
            </div>
            {locationError && <p className="text-xs text-red-500 mt-1.5">{locationError}</p>}
          </Field>
          <Field label={t('profile.capacity')} hint={t('profile.capacityHint')}>
            <input {...register('capacity')} type="number" min={1} max={20} className={inp} dir="ltr" />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="px-5 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? t('common.saving') : t('profile.saveChanges')}
          </button>
        </form>

        {/* ── Products ordered ── */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2 font-semibold text-prima-dark">
            <ShoppingBag className="w-4 h-4 text-gray-400" /> {t('profile.productsOrdered')}
          </div>
          {!productsOrdered ? (
            <p className="text-gray-400 text-sm px-4 sm:px-6 py-6">{t('common.loading')}</p>
          ) : productsOrdered.length === 0 ? (
            <p className="text-gray-400 text-sm px-4 sm:px-6 py-6">{t('profile.noProductsOrdered')}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {productsOrdered.map((p) => (
                <div key={p.product_id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-prima-dark flex-1 truncate">{p.name}</p>
                  <span className="text-sm font-bold text-prima-dark">×{p.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-prima-dark mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ms-1 text-xs">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}
