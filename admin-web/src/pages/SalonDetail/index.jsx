import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { getSalon, getSalonStats, updateSalonPhone, approveSalon, rejectSalon, deleteSalon } from '../../api/salons'
import Layout from '../../components/Layout'

const PHONE_REGEX = /^(\+963|0)9[1-9]\d{7}$/
const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6]

export default function SalonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(6)
  const [stats, setStats] = useState(null)

  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneValue, setPhoneValue] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const load = () => {
    setLoading(true)
    getSalon(id).then(setSalon).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { getSalonStats(id, months).then(setStats) }, [id, months])

  const startEditPhone = () => {
    setPhoneValue(salon.phone ?? '')
    setPhoneError('')
    setEditingPhone(true)
  }

  const savePhone = async () => {
    if (!PHONE_REGEX.test(phoneValue)) {
      setPhoneError(t('salonDetail.phoneInvalid'))
      return
    }
    setSavingPhone(true)
    setPhoneError('')
    try {
      const updated = await updateSalonPhone(id, phoneValue)
      setSalon(updated)
      setEditingPhone(false)
    } catch {
      setPhoneError(t('salonDetail.phoneUpdateFailed'))
    } finally {
      setSavingPhone(false)
    }
  }

  const approve = async () => {
    await approveSalon(id)
    load()
  }

  const confirmReject = async () => {
    await rejectSalon(id, rejectReason)
    setRejecting(false)
    load()
  }

  const remove = async () => {
    if (!confirm(t('salons.deleteConfirm'))) return
    await deleteSalon(id)
    navigate('/salons')
  }

  if (loading || !salon) {
    return <Layout><div className="p-8 text-gray-400">{t('common.loading')}</div></Layout>
  }

  const statusColor = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-orange-100 text-orange-700',
  }[salon.status] ?? 'bg-gray-100 text-gray-600'

  const ov = stats?.overview ?? {}
  const workingHoursByDay = Object.fromEntries((salon.working_hours ?? []).map((w) => [w.day_of_week, w]))

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/salons" className="text-sm text-gray-400 hover:text-prima-dark inline-flex items-center gap-1 mb-2">
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('salonDetail.back')}
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-prima-dark">{salon.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {t(`salons.status.${salon.status}`)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {salon.status !== 'approved' && <Btn color="green" onClick={approve}>{t('salons.approve')}</Btn>}
            {salon.status !== 'rejected' && <Btn color="red" onClick={() => { setRejecting(true); setRejectReason('') }}>{t('salons.reject')}</Btn>}
            <Btn color="gray" onClick={remove}>{t('salons.delete')}</Btn>
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-start gap-4 mb-5">
            {salon.logo_url ? (
              <img src={salon.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-prima-orange to-prima-green flex items-center justify-center text-white text-xl font-bold shrink-0">
                {salon.name?.[0]}
              </div>
            )}
            <div className="min-w-0">
              {salon.description && <p className="text-sm text-gray-500">{salon.description}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <Field label={t('salonDetail.address')} value={`${salon.address ?? '—'}, ${salon.city ?? ''}`} />
            <Field label={t('salons.table.owner')} value={salon.user?.name ?? '—'} sub={salon.user?.email} />
            <PhoneField
              t={t}
              editing={editingPhone}
              phone={salon.phone}
              value={phoneValue}
              onChange={setPhoneValue}
              error={phoneError}
              saving={savingPhone}
              onEdit={startEditPhone}
              onSave={savePhone}
              onCancel={() => setEditingPhone(false)}
            />
            <Field label={t('salonDetail.capacity')} value={salon.capacity ?? '—'} />
            <Field
              label={t('salonDetail.rating')}
              value={salon.average_rating != null ? `★ ${salon.average_rating}` : t('salonDetail.noRating')}
              sub={salon.reviews_count != null ? `${salon.reviews_count} ${t('salonDetail.reviews')}` : null}
            />
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">
            {t('salonDetail.services')}
          </div>
          {(salon.services ?? []).length === 0 ? (
            <p className="text-gray-400 text-sm p-5 sm:p-6">{t('salonDetail.noServices')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                <tr>
                  {[t('salonDetail.table.name'), t('salonDetail.table.price'), t('salonDetail.table.category')].map((h, i) => (
                    <th key={i} className="px-5 sm:px-6 py-3 text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salon.services.map((svc) => (
                  <tr key={svc.id} className="border-t border-gray-100">
                    <td className="px-5 sm:px-6 py-3 font-medium text-prima-dark">{svc.name}</td>
                    <td className="px-5 sm:px-6 py-3">${svc.price}</td>
                    <td className="px-5 sm:px-6 py-3 text-gray-500">{svc.category ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Working hours */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">
            {t('salonDetail.workingHours')}
          </div>
          {(salon.working_hours ?? []).length === 0 ? (
            <p className="text-gray-400 text-sm p-5 sm:p-6">{t('salonDetail.noWorkingHours')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                <tr>
                  {[t('salonDetail.table.day'), t('salonDetail.table.hours')].map((h, i) => (
                    <th key={i} className="px-5 sm:px-6 py-3 text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAY_ORDER.filter((d) => workingHoursByDay[d]).map((d) => {
                  const w = workingHoursByDay[d]
                  return (
                    <tr key={d} className="border-t border-gray-100">
                      <td className="px-5 sm:px-6 py-3 font-medium text-prima-dark">{t(`days.${d}`)}</td>
                      <td className="px-5 sm:px-6 py-3 text-gray-500">
                        {w.is_closed
                          ? <span className="text-red-500">{t('salonDetail.closed')}</span>
                          : <span dir="ltr">{w.open_time} – {w.close_time}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-prima-dark">{t('salonDetail.overview')}</h2>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {[3, 6, 12].map((m) => <option key={m} value={m}>{t('analytics.lastMonths', { count: m })}</option>)}
          </select>
        </div>

        {!stats ? (
          <p className="text-gray-400">{t('common.loading')}</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('analytics.totalAppointments')}     value={ov.total_appointments ?? '—'} />
              <StatCard label={t('salonDetail.pendingAppointments')} value={ov.pending_appointments ?? '—'} />
              <StatCard label={t('salonDetail.confirmedAppointments')} value={ov.confirmed_appointments ?? '—'} />
              <StatCard label={t('salonDetail.cancelledAppointments')} value={ov.cancelled_appointments ?? '—'} />
              <StatCard label={t('analytics.totalRevenue')}          value={`$${ov.total_revenue ?? 0}`} gradient />
              <StatCard label={t('salonDetail.thisMonthRevenue')}    value={`$${ov.this_month_revenue ?? 0}`} />
              <StatCard label={t('analytics.totalOrders')}           value={ov.total_orders ?? '—'} />
              <StatCard label={t('salonDetail.totalSpentOnProducts')} value={`$${ov.total_spent_on_products ?? 0}`} />
            </div>

            {stats.monthly_revenue?.length > 0 && (
              <ChartCard title={t('salonDetail.monthlyRevenue')}>
                <LineChart data={stats.monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#e8481c" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ChartCard>
            )}

            {stats.monthly_appointments?.length > 0 && (
              <ChartCard title={t('analytics.monthlyAppointments')}>
                <BarChart data={stats.monthly_appointments}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#263238" radius={[4, 4, 0, 0]} name={t('analytics.seriesAppointments')} />
                </BarChart>
              </ChartCard>
            )}

            {stats.busiest_days?.length > 0 && (
              <ChartCard title={t('salonDetail.busiestDays')}>
                <BarChart data={stats.busiest_days.map((d) => ({ ...d, label: t(`days.${DAY_NAME_TO_INDEX[d.day]}`) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2db563" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartCard>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {stats.top_services?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">{t('salonDetail.topServices')}</div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                      <tr>
                        {[t('salonDetail.table.service'), t('salonDetail.table.count'), t('analytics.table.revenue')].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-start">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_services.map((s) => (
                        <tr key={s.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-prima-dark">{s.name}</td>
                          <td className="px-4 py-3">{s.appointments_count ?? 0}</td>
                          <td className="px-4 py-3 font-medium">${s.revenue ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {Object.keys(stats.orders_summary ?? {}).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">{t('salonDetail.ordersSummary')}</div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                      <tr>
                        {[t('salonDetail.table.status'), t('salonDetail.table.count'), t('analytics.table.revenue')].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-start">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(stats.orders_summary).map((row, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-prima-dark">
                              {t(`orders.status.${row.status}`, { defaultValue: row.status })}
                            </span>
                          </td>
                          <td className="px-4 py-3">{row.count}</td>
                          <td className="px-4 py-3 font-medium">${row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {stats.ordered_products?.length > 0 && (
                    <div className="border-t border-gray-100">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">{t('salonDetail.orderedProducts')}</div>
                      <div className="divide-y divide-gray-50">
                        {stats.ordered_products.map((p) => (
                          <div key={p.product_id} className="px-4 py-2 flex items-center gap-3">
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                            )}
                            <p className="text-sm text-prima-dark flex-1 truncate">{p.name}</p>
                            <span className="text-sm font-semibold text-prima-dark">×{p.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {stats.recent_appointments?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">{t('salonDetail.recentAppointments')}</div>
                <div className="divide-y divide-gray-100">
                  {stats.recent_appointments.map((a) => (
                    <div key={a.id} className="px-5 sm:px-6 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-prima-dark truncate">
                          {a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {a.service?.name ?? '—'} · {new Date(a.scheduled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-prima-dark shrink-0">
                        {t(`salonDetail.appointmentStatus.${a.status}`, { defaultValue: a.status })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reject modal */}
        {rejecting && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100">
              <h2 className="font-semibold text-prima-dark mb-3">{t('salons.rejectTitle', { name: salon.name })}</h2>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('salons.rejectReasonPlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button onClick={confirmReject} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors">{t('salons.confirmReject')}</button>
                <button onClick={() => setRejecting(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">{t('common.cancel')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

// Backend sends English day names (matches Carbon::dayOfWeek order); map to the days.* translation keys.
const DAY_NAME_TO_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }

function Field({ label, value, sub }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-medium text-prima-dark">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function PhoneField({ t, editing, phone, value, onChange, error, saving, onEdit, onSave, onCancel }) {
  if (!editing) {
    return (
      <div>
        <p className="text-xs text-gray-400 mb-1">{t('salonDetail.phone')}</p>
        <div className="flex items-center gap-2">
          <p className="font-medium text-prima-dark" dir="ltr">{phone || t('salonDetail.noPhone')}</p>
          <button onClick={onEdit} className="text-xs text-prima-orange hover:underline">{t('salonDetail.edit')}</button>
        </div>
      </div>
    )
  }
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{t('salonDetail.phone')}</p>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          placeholder="0991234567"
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button onClick={onSave} disabled={saving} className="text-xs bg-prima-orange text-white px-2.5 py-1 rounded-lg disabled:opacity-50">
          {saving ? t('common.saving') : t('common.save')}
        </button>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-prima-dark">{t('common.cancel')}</button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function Btn({ children, onClick, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    red:   'bg-red-50 text-red-700 hover:bg-red-100',
    gray:  'bg-gray-100 text-gray-600 hover:bg-gray-200',
  }
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colors[color]}`}>
      {children}
    </button>
  )
}

function StatCard({ label, value, gradient }) {
  if (gradient) return (
    <div className="rounded-xl p-4 bg-gradient-to-br from-prima-orange to-prima-green text-white shadow-md">
      <p className="text-xs text-white/80 uppercase tracking-wide mb-1 truncate">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">{label}</p>
      <p className="text-xl font-bold text-prima-dark">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <p className="font-semibold text-prima-dark mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={220}>{children}</ResponsiveContainer>
    </div>
  )
}
