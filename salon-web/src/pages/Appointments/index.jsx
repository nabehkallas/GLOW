import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import WalkInForm from '../../components/WalkInForm'
import WalkInOrBlockChoice from '../../components/WalkInOrBlockChoice'
import BlockForm from '../../components/BlockForm'
import useRecentSearches from '../../hooks/useRecentSearches'
import RecentSearchChips from '../../components/RecentSearchChips'

const STATUS_KEYS = ['all', 'pending', 'cancellation_requested', 'confirmed', 'completed', 'cancelled']

export default function Appointments() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const initialStatus = STATUS_KEYS.includes(searchParams.get('status')) ? searchParams.get('status') : 'pending'
  const [status, setStatus] = useState(initialStatus)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const { terms: recentSearches, logSearch } = useRecentSearches('appointment')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { type: 'choice' } | { type: 'walkin' } | { type: 'block' } | { type: 'complete', appointment }

  const load = (s, from, to, q) => {
    setLoading(true)
    api.get('/salon/appointments', { params: { status: s, date_from: from || undefined, date_to: to || undefined, search: q || undefined } })
      .then(({ data }) => setAppointments(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timeout = setTimeout(() => load(status, dateFrom, dateTo, search), search ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [status, dateFrom, dateTo, search])

  const NEXT_STATUS = { confirm: 'confirmed', complete: 'completed', cancel: 'cancelled', 'approve-cancellation': 'cancelled', 'deny-cancellation': 'confirmed' }

  const action = async (id, verb) => {
    // Optimistically remove from current list immediately
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    try {
      await api.patch(`/salon/appointments/${id}/${verb}`)
      const next = NEXT_STATUS[verb]
      if (next) setStatus(next) // switch to the tab where the appointment landed
    } catch (e) {
      // Restore list on failure
      load(status, dateFrom, dateTo, search)
    }
  }

  const onCompleted = () => {
    setModal(null)
    setStatus('completed') // switch to the tab where the appointment landed; triggers reload via the effect above
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-prima-dark">{t('appointments.title')}</h1>
          <button
            onClick={() => setModal({ type: 'choice' })}
            className="px-3 sm:px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg shadow-sm font-medium transition-colors"
          >
            {t('appointments.addEntry')}
          </button>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => logSearch(search)}
            placeholder={t('appointments.searchPlaceholder')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          {!search && <RecentSearchChips terms={recentSearches} onSelect={setSearch} />}
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
              {s === 'all' ? t('common.all') : t('status.' + s)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Field label={t('appointments.dateFrom')}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              dir="ltr"
            />
          </Field>
          <Field label={t('appointments.dateTo')}>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              dir="ltr"
            />
          </Field>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className="text-xs text-gray-400 hover:text-prima-dark underline pb-2"
            >
              {t('appointments.clearDates')}
            </button>
          )}
        </div>

        {modal?.type === 'choice' && (
          <Modal onClose={() => setModal(null)}>
            <WalkInOrBlockChoice
              onPickWalkIn={() => setModal({ type: 'walkin' })}
              onPickBlock={() => setModal({ type: 'block' })}
            />
          </Modal>
        )}

        {modal?.type === 'walkin' && (
          <Modal onClose={() => setModal(null)}>
            <WalkInForm
              onClose={() => setModal(null)}
              onSaved={() => { setModal(null); setStatus('confirmed'); load('confirmed') }}
            />
          </Modal>
        )}

        {modal?.type === 'block' && (
          <Modal onClose={() => setModal(null)}>
            <BlockForm onClose={() => setModal(null)} onSaved={() => setModal(null)} />
          </Modal>
        )}

        {modal?.type === 'complete' && (
          <Modal onClose={() => setModal(null)}>
            <CompleteAppointmentForm appointment={modal.appointment} onClose={() => setModal(null)} onSaved={onCompleted} />
          </Modal>
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
                        <td className="px-6 py-3">
                          {a.service?.name ?? (a.source === 'manual' ? t('appointments.other') : '—')}
                          {a.cancellation_reason && (
                            <p className="text-xs text-orange-500 italic mt-0.5">{t('appointments.cancellationReason')}: {a.cancellation_reason}</p>
                          )}
                        </td>
                        <td className="px-6 py-3">{new Date(a.scheduled_at).toLocaleString()}</td>
                        <td className="px-6 py-3 font-semibold text-prima-dark">${a.price_at_booking}</td>
                        <td className="px-6 py-3"><SourceBadge source={a.source} /></td>
                        <td className="px-6 py-3"><ActionButtons status={status} appointment={a} action={action} onComplete={() => setModal({ type: 'complete', appointment: a })} /></td>
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
                      {a.cancellation_reason && (
                        <p className="text-xs text-orange-500 italic mt-0.5">{t('appointments.cancellationReason')}: {a.cancellation_reason}</p>
                      )}
                    </div>
                    <SourceBadge source={a.source} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(a.scheduled_at).toLocaleString()}</span>
                    <span className="font-semibold text-prima-dark">${a.price_at_booking}</span>
                  </div>
                  <div className="flex gap-2 pt-1"><ActionButtons status={status} appointment={a} action={action} onComplete={() => setModal({ type: 'complete', appointment: a })} /></div>
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

function ActionButtons({ status, appointment, action, onComplete }) {
  const { t } = useTranslation()
  const id = appointment.id
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
          <Btn onClick={onComplete} color="green">{t('common.complete')}</Btn>
          <Btn onClick={() => action(id, 'cancel')} color="red">{t('common.cancel')}</Btn>
        </>
      )}
      {status === 'cancellation_requested' && (
        <>
          <Btn onClick={() => action(id, 'deny-cancellation')} color="green">{t('appointments.denyCancellation')}</Btn>
          <Btn onClick={() => action(id, 'approve-cancellation')} color="red">{t('appointments.approveCancellation')}</Btn>
        </>
      )}
    </>
  )
}

function CompleteAppointmentForm({ appointment, onClose, onSaved }) {
  const { t } = useTranslation()
  const [price, setPrice] = useState(appointment.price_at_booking ?? '')
  const [notes, setNotes] = useState(appointment.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.patch(`/salon/appointments/${appointment.id}/complete`, {
        price_at_booking: price === '' ? undefined : Number(price),
        notes: notes === '' ? null : notes,
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message ?? t('appointments.completeFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-semibold text-prima-dark mb-4">{t('appointments.completeTitle')}</h2>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('common.price')}>
          <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} autoFocus />
        </Field>
        <Field label={t('common.notes')}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inp} rows={3} />
        </Field>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
          >
            {saving ? t('common.saving') : t('common.complete')}
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
