import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Services() {
  const { t } = useTranslation()
  const [services, setServices] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const load = () => api.get('/salon/services').then(({ data }) => setServices(data.data ?? data))
  useEffect(() => { load() }, [])

  const openNew = () => {
    reset({ name: '', price: '', duration_minutes: '', category: '', description: '', available_from: '', available_until: '' })
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (s) => {
    reset({ ...s, available_from: s.available_from ?? '', available_until: s.available_until ?? '' })
    setEditing(s.id)
    setShowForm(true)
  }

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      available_from: data.available_from || null,
      available_until: data.available_until || null,
    }
    if (editing) await api.put(`/salon/services/${editing}`, payload)
    else await api.post('/salon/services', payload)
    setShowForm(false)
    load()
  }

  const destroy = async (id) => {
    if (!confirm(t('services.deleteConfirm'))) return
    await api.delete(`/salon/services/${id}`)
    load()
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-prima-dark">{t('services.title')}</h1>
          <button
            onClick={openNew}
            className="px-3 sm:px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg shadow-sm font-medium transition-colors"
          >
            {t('services.addService')}
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-semibold text-prima-dark mb-4">{editing ? t('services.editService') : t('services.newService')}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('common.name')} error={errors.name?.message}>
                <input {...register('name', { required: true })} className={inp} />
              </Field>
              <Field label={t('common.category')}>
                <input {...register('category')} className={inp} placeholder={t('services.categoryPlaceholder')} />
              </Field>
              <Field label={t('services.priceDollar')}>
                <input {...register('price', { required: true })} type="number" step="0.01" className={inp} dir="ltr" />
              </Field>
              <Field label={t('services.durationMinutes')}>
                <input {...register('duration_minutes', { required: true })} type="number" className={inp} dir="ltr" />
              </Field>
              <Field label={t('services.availableFrom')} hint={t('services.availableFromHint')}>
                <input {...register('available_from')} type="time" className={inp} dir="ltr" />
              </Field>
              <Field label={t('services.availableUntil')} hint={t('services.availableUntilHint')}>
                <input {...register('available_until')} type="time" className={inp} dir="ltr" />
              </Field>
              <div className="col-span-full">
                <Field label={t('common.description')}>
                  <textarea {...register('description')} className={inp} rows={2} />
                </Field>
              </div>
              <div className="col-span-full flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
                >
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-prima-dark">{s.name}</p>
                  {s.category && (
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {s.category}
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-prima-orange">${s.price}</p>
              </div>
              <p className="text-sm text-gray-500 mt-2">{s.duration_minutes} {t('services.min')}{s.description && ` · ${s.description}`}</p>
              {(s.available_from || s.available_until) && (
                <p className="text-xs text-orange-500 mt-1">
                  {t('services.availableLabel')}: {s.available_from ?? '—'} – {s.available_until ?? '—'}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(s)} className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                  {t('common.edit')}
                </button>
                <button onClick={() => destroy(s.id)} className="text-xs px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
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
