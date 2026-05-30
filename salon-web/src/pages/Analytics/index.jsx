import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Analytics() {
  const { t } = useTranslation()
  const [months, setMonths] = useState(6)
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get(`/salon/analytics?months=${months}`).then(({ data }) => setData(data))
  }, [months])

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-prima-dark">{t('analytics.title')}</h1>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            dir="ltr"
          >
            {[3, 6, 12].map((m) => <option key={m} value={m}>{t('analytics.lastMonths', { count: m })}</option>)}
          </select>
        </div>

        {!data ? <p className="text-gray-500">{t('common.loading')}</p> : (
          <div className="space-y-4 sm:space-y-6">
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
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
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
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="url(#apptBar)" radius={[4, 4, 0, 0]} />
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
          </div>
        )}
      </div>
    </Layout>
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
