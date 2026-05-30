import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

const STATUS_KEYS = ['pending', 'confirmed', 'completed', 'cancelled']

export default function Appointments() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('pending')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [services, setServices] = useState([])

  const load = (s) => {
    setLoading(true)
    api.get(`/salon/appointments?status=${s}`)
      .then(({ data }) => setAppointments(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(status) }, [status])
  useEffect(() => { api.get('/salon/services').then(({ data }) => setServices(data.data ?? data)) }, [])

  const NEXT_STATUS = { confirm: 'confirmed', complete: 'completed', cancel: 'cancelled' }

  const action = async (id, verb) => {
    // Optimistically remove from current list immediately
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    try {
      await api.patch(`/salon/appointments/${id}/${verb}`)
      const next = NEXT_STATUS[verb]
      if (next) setStatus(next) // switch to the tab where the appointment landed
    } catch (e) {
      // Restore list on failure
      load(status)
    }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-prima-dark">{t('appointments.title')}</h1>
          <button
            onClick={() => setShowWalkIn(true)}
            className="px-3 sm:px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg shadow-sm font-medium transition-colors"
          >
            {t('appointments.addWalkIn')}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_KEYS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                status === s
                  ? 'bg-prima-orange text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('status.' + s)}
            </button>
          ))}
        </div>

        {showWalkIn && (
          <WalkInForm
            services={services}
            onClose={() => setShowWalkIn(false)}
            onSaved={() => { setShowWalkIn(false); setStatus('confirmed'); load('confirmed') }}
          />
        )}

        {loading ? (
          <p className="text-gray-500">{t('common.loading')}</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-400">{t('appointments.noAppointments', { status: t('status.' + status) })}</p>
        ) : (
          <>
            <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                    <tr>
                      {[t('common.client'), t('common.service'), t('appointments.scheduledAt'), t('common.price'), t('common.source'), t('common.actions')].map((h) => (
                        <th key={h} className="px-6 py-3 text-start">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                        <td className="px-6 py-3">{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</td>
                        <td className="px-6 py-3">{a.service?.name ?? (a.source === 'manual' ? t('appointments.other') : '—')}</td>
                        <td className="px-6 py-3">{new Date(a.scheduled_at).toLocaleString()}</td>
                        <td className="px-6 py-3 font-semibold text-prima-dark">${a.price_at_booking}</td>
                        <td className="px-6 py-3"><SourceBadge source={a.source} /></td>
                        <td className="px-6 py-3"><ActionButtons status={status} id={a.id} action={action} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sm:hidden space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-prima-dark text-sm">{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.service?.name ?? (a.source === 'manual' ? t('appointments.other') : '—')}</p>
                    </div>
                    <SourceBadge source={a.source} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(a.scheduled_at).toLocaleString()}</span>
                    <span className="font-semibold text-prima-dark">${a.price_at_booking}</span>
                  </div>
                  <div className="flex gap-2 pt-1"><ActionButtons status={status} id={a.id} action={action} /></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function SourceBadge({ source }) {
  const { t } = useTranslation()
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${source === 'manual' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
      {source === 'manual' ? t('appointments.walkInBadge') : t('appointments.appBadge')}
    </span>
  )
}

function ActionButtons({ status, id, action }) {
  const { t } = useTranslation()
  return (
    <>
      {status === 'pending' && (
        <>
          <Btn onClick={() => action(id, 'confirm')} color="blue">{t('common.confirm')}</Btn>
          <Btn onClick={() => action(id, 'cancel')} color="red">{t('common.cancel')}</Btn>
        </>
      )}
      {status === 'confirmed' && (
        <>
          <Btn onClick={() => action(id, 'complete')} color="green">{t('common.complete')}</Btn>
          <Btn onClick={() => action(id, 'cancel')} color="red">{t('common.cancel')}</Btn>
        </>
      )}
    </>
  )
}

const DURATION_OPTIONS = [15,30,45,60,75,90,105,120,135,150,165,180]

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function WalkInForm({ services, onClose, onSaved }) {
  const { t } = useTranslation()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [error, setError] = useState('')

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
    <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
      <h2 className="font-semibold text-prima-dark mb-4">{t('appointments.addWalkInTitle')}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('appointments.clientName')} error={errors.client_name?.message}>
          <input {...register('client_name', { required: true })} className={inp} placeholder={t('appointments.clientPlaceholder')} />
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

function Btn({ children, onClick, color }) {
  const colors = {
    blue:  'bg-blue-50 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    red:   'bg-red-50 text-red-700 hover:bg-red-100',
  }
  return <button onClick={onClick} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${colors[color]}`}>{children}</button>
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
