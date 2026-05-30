import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/auth'

export default function Profile() {
  const { t } = useTranslation()
  const { setUser } = useAuthStore()
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm()

  const [logoUrl,   setLogoUrl]   = useState(null)
  const [salonName, setSalonName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    api.get('/salon/profile').then(({ data }) => {
      setLogoUrl(data.salon?.logo_url ?? null)
      setSalonName(data.salon?.name ?? '')
      reset({
        salon_name:  data.salon?.name ?? '',
        description: data.salon?.description ?? '',
        address:     data.salon?.address ?? '',
        city:        data.salon?.city ?? '',
        phone:       data.phone ?? '',
        latitude:    data.salon?.latitude ?? '',
        longitude:   data.salon?.longitude ?? '',
        capacity:    data.salon?.capacity ?? 1,
      })
    })
  }, [])

  const onSubmit = async (data) => {
    const res = await api.put('/salon/profile', data)
    setUser(res.data)
    setSalonName(res.data.salon?.name ?? '')
    reset({
      salon_name:  res.data.salon?.name ?? '',
      description: res.data.salon?.description ?? '',
      address:     res.data.salon?.address ?? '',
      city:        res.data.salon?.city ?? '',
      phone:       res.data.phone ?? '',
      latitude:    res.data.salon?.latitude ?? '',
      longitude:   res.data.salon?.longitude ?? '',
      capacity:    res.data.salon?.capacity ?? 1,
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
      setLogoUrl(res.data.logo_url ?? null)
    } catch {
      alert(t('profile.logoFailed'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('profile.latitude')}><input {...register('latitude')} type="number" step="any" className={inp} dir="ltr" /></Field>
            <Field label={t('profile.longitude')}><input {...register('longitude')} type="number" step="any" className={inp} dir="ltr" /></Field>
          </div>
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
