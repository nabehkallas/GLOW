import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

const DURATION_OPTIONS = [15,30,45,60,75,90,105,120,135,150,165,180]

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

export default function WalkInForm({ onClose, onSaved, defaultScheduledAt }) {
  const { t } = useTranslation()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { scheduled_at: defaultScheduledAt ?? '' },
  })
  const [error, setError] = useState('')
  const [services, setServices] = useState([])

  useEffect(() => {
    api.get('/salon/services').then(({ data }) => setServices(data.data ?? data))
  }, [])

  const selectedServiceId = watch('salon_service_id')
  const isOther = !selectedServiceId

  const onSubmit = async (data) => {
    setError('')
    try {
      const serviceId = data.salon_service_id ? Number(data.salon_service_id) : null
      const payload = {
        ...data,
        salon_service_id: serviceId,
        duration_minutes: serviceId ? undefined : Number(data.duration_minutes),
      }
      await api.post('/salon/appointments', payload)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('appointments.failedToAdd'))
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-semibold text-prima-dark mb-4">{t('appointments.addWalkInTitle')}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('appointments.clientName')} error={errors.client_name?.message}>
          <input {...register('client_name', { required: true })} className={inp} placeholder={t('appointments.clientPlaceholder')} />
        </Field>
        <Field label={t('appointments.clientPhone')} error={errors.client_phone?.message}>
          <input {...register('client_phone', { required: true })} className={inp} placeholder={t('appointments.clientPhonePlaceholder')} dir="ltr" />
        </Field>
        <Field label={`${t('common.service')} (${t('common.optional')})`}>
          <select {...register('salon_service_id')} className={inp}>
            <option value="">{t('appointments.other')}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} {t('appointments.min')})</option>
            ))}
          </select>
        </Field>
        {isOther && (
          <Field label={t('appointments.duration')} error={errors.duration_minutes?.message}>
            <select {...register('duration_minutes', { required: isOther })} className={inp} defaultValue="60">
              {DURATION_OPTIONS.map((m) => (
                <option key={m} value={m}>{formatDuration(m)}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t('appointments.dateTime')} error={errors.scheduled_at?.message}>
          <input {...register('scheduled_at', { required: true })} type="datetime-local" className={inp} dir="ltr" />
        </Field>
        <Field label={t('common.notes')}>
          <input {...register('notes')} className={inp} placeholder={t('appointments.optionalNotes')} />
        </Field>
        {error && <p className="col-span-full text-red-600 text-sm">{error}</p>}
        <div className="col-span-full flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
          >
            {isSubmitting ? t('common.saving') : t('appointments.addAppointment')}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent'
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-prima-dark mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
