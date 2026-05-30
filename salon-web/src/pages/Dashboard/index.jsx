import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)

  useEffect(() => { api.get('/salon/analytics').then(({ data }) => setStats(data)) }, [])

  if (!stats) return <Layout><div className="p-4 sm:p-8 text-gray-500">{t('common.loading')}</div></Layout>

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <h1 className="text-2xl font-bold text-prima-dark">{t('dashboard.title')}</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label={t('dashboard.thisMonthRevenue')} value={`$${stats.this_month_revenue ?? 0}`} gradient />
          <StatCard label={t('dashboard.totalAppointments')} value={stats.total_appointments ?? 0} />
          <StatCard label={t('dashboard.pending')} value={stats.pending_appointments ?? 0} accent />
          <StatCard label={t('dashboard.avgRating')} value={stats.average_rating ?? '—'} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {stats.top_services?.length > 0 && (
            <ChartCard title={t('dashboard.topServices')}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.top_services}>
                  <defs>
                    <linearGradient id="primaBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8481c" />
                      <stop offset="100%" stopColor="#2db563" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="url(#primaBar)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {stats.busiest_days?.length > 0 && (
            <ChartCard title={t('dashboard.busiestDays')}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.busiest_days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#263238" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {stats.recent_appointments?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">
              {t('dashboard.recentAppointments')}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                  <tr>
                    {[t('common.client'), t('common.service'), t('dashboard.date'), t('common.status')].map((h) => (
                      <th key={h} className="px-6 py-3 text-start">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_appointments.map((a) => (
                    <tr key={a.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                      <td className="px-6 py-3">{a.client?.name ?? a.client_name ?? '—'}</td>
                      <td className="px-6 py-3">{a.service?.name ?? '—'}</td>
                      <td className="px-6 py-3">{new Date(a.scheduled_at).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(a.status)}`}>
                          {t('status.' + a.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden divide-y divide-gray-100">
              {stats.recent_appointments.map((a) => (
                <div key={a.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-prima-dark text-sm">{a.client?.name ?? a.client_name ?? '—'}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(a.status)}`}>
                      {t('status.' + a.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{a.service?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{new Date(a.scheduled_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, accent, gradient }) {
  if (gradient) return (
    <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-br from-prima-orange to-prima-green text-white shadow-md">
      <p className="text-xs text-white/80 mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
    </div>
  )
  if (accent) return (
    <div className="rounded-xl p-4 sm:p-5 bg-orange-50 border border-orange-200">
      <p className="text-xs text-orange-600 mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-orange-700">{value}</p>
    </div>
  )
  return (
    <div className="rounded-xl p-4 sm:p-5 bg-white border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-prima-dark">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <p className="font-semibold text-prima-dark mb-4">{title}</p>
      {children}
    </div>
  )
}

function statusColor(s) {
  return {
    pending:   'bg-orange-100 text-orange-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] ?? 'bg-gray-100 text-gray-600'
}
