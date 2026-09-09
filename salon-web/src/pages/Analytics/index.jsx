import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'
import Layout from '../../components/Layout'

// Backend sends English day names (matches Carbon::dayOfWeek order); map to the day.* translation keys.
const DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }

export default function Analytics() {
  const { t } = useTranslation()
  const [months, setMonths] = useState(6)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState(null)
  const ranged = Boolean(dateFrom && dateTo)

  useEffect(() => {
    const params = ranged ? { date_from: dateFrom, date_to: dateTo } : { months }
    api.get('/salon/analytics', { params }).then(({ data }) => setData(data))
  }, [months, dateFrom, dateTo, ranged])

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-prima-dark">{t('analytics.title')}</h1>
          <div className="flex items-end gap-3 flex-wrap">
            <Field label={t('appointments.dateFrom')}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                dir="ltr"
              />
            </Field>
            <Field label={t('appointments.dateTo')}>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                dir="ltr"
              />
            </Field>
            {ranged ? (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-gray-400 hover:text-prima-dark underline pb-2"
              >
                {t('appointments.clearDates')}
              </button>
            ) : (
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-0.5"
                dir="ltr"
              >
                {[3, 6, 12].map((m) => <option key={m} value={m}>{t('analytics.lastMonths', { count: m })}</option>)}
              </select>
            )}
          </div>
        </div>

        {!data ? <p className="text-gray-500">{t('common.loading')}</p> : (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label={t('analytics.totalAppointments')}    value={data.overview.total_appointments} />
              <StatCard label={t('analytics.pendingAppointments')}  value={data.overview.pending_appointments} color="text-orange-500" />
              <StatCard label={t('analytics.confirmedAppointments')} value={data.overview.confirmed_appointments} color="text-blue-600" />
              <StatCard label={t('analytics.cancelledAppointments')} value={data.overview.cancelled_appointments} color="text-red-500" />
              <StatCard label={t('analytics.thisMonthRevenue')}     value={`$${data.overview.this_month_revenue}`} color="text-prima-green" />
              <StatCard label={t('analytics.totalSpentOnProducts')} value={`$${data.overview.total_spent_on_products}`} />
            </div>

            {data.monthly_revenue?.length > 0 && (
              <Chart title={t('analytics.monthlyRevenue')}>
                <LineChart data={data.monthly_revenue}>
                  <defs>
                    <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#e8481c" />
                      <stop offset="100%" stopColor="#2db563" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="url(#revLine)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </Chart>
            )}

            {data.monthly_appointments?.length > 0 && (
              <Chart title={t('analytics.monthlyAppointments')}>
                <BarChart data={data.monthly_appointments}>
                  <defs>
                    <linearGradient id="apptBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8481c" />
                      <stop offset="100%" stopColor="#2db563" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="url(#apptBar)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </Chart>
            )}

            {data.busiest_days?.length > 0 && (
              <Chart title={t('analytics.busiestDays')}>
                <BarChart data={data.busiest_days.map((d) => ({ ...d, label: t(`days.${DAY_INDEX[d.day]}`) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#263238" radius={[4, 4, 0, 0]} />
                </BarChart>
              </Chart>
            )}

            {data.top_services?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">
                  {t('analytics.topServices')}
                </div>
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                      <tr>
                        {[t('common.service'), t('analytics.bookings'), t('analytics.revenue')].map((h) => (
                          <th key={h} className="px-6 py-3 text-start">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_services.map((s, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-slate-50/50">
                          <td className="px-6 py-3 font-medium text-prima-dark">{s.name}</td>
                          <td className="px-6 py-3">{s.count}</td>
                          <td className="px-6 py-3 font-semibold">${s.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="sm:hidden divide-y divide-gray-100">
                  {data.top_services.map((s, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-prima-dark">{s.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.count} {t('analytics.bookings')}</p>
                      </div>
                      <p className="text-sm font-bold text-prima-dark">${s.revenue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {Object.keys(data.orders_summary ?? {}).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">
                    {t('analytics.ordersSummary')}
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                      <tr>
                        {[t('common.status'), t('analytics.count'), t('analytics.revenue')].map((h) => (
                          <th key={h} className="px-4 sm:px-6 py-3 text-start">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(data.orders_summary).map((row, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-slate-50/50">
                          <td className="px-4 sm:px-6 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-prima-dark">
                              {t(`status.${row.status}`)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3">{row.count}</td>
                          <td className="px-4 sm:px-6 py-3 font-semibold">${row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {data.recent_appointments?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">
                    {t('analytics.recentAppointments')}
                  </div>
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {data.recent_appointments.map((a) => (
                      <div key={a.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-prima-dark truncate">
                            {a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {a.service?.name ?? t('appointments.other')} · {new Date(a.scheduled_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-prima-dark shrink-0">
                          {t(`status.${a.status}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, color = 'text-prima-dark' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
      <p className="text-xs text-gray-500 mb-1 truncate">{label}</p>
      <p className={`text-lg sm:text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function Chart({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <p className="font-semibold text-prima-dark mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={220}>{children}</ResponsiveContainer>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-prima-dark mb-1">{label}</label>
      {children}
    </div>
  )
}
