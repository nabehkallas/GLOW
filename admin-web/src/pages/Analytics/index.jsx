import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Analytics() {
  const [months, setMonths] = useState(6)
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get(`admin/analytics?months=${months}`).then(({ data }) => setData(data))
  }, [months])

  const ov = data?.overview ?? {}
  const totalRevenue = ((ov.total_order_revenue ?? 0) + (ov.total_appointment_revenue ?? 0)).toFixed(2)

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-prima-dark">Analytics</h1>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {[3, 6, 12].map((m) => <option key={m} value={m}>Last {m} months</option>)}
          </select>
        </div>

        {!data ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Revenue"       value={`$${totalRevenue}`} gradient />
              <StatCard label="Total Appointments"  value={ov.total_appointments ?? '—'} />
              <StatCard label="Total Orders"        value={ov.total_orders ?? '—'} />
              <StatCard label="Pending Salons"      value={ov.pending_salons ?? '—'} accent />
            </div>

            {data.monthly_appointments?.length > 0 && (
              <ChartCard title="Monthly Appointments">
                <BarChart data={data.monthly_appointments}>
                  <defs>
                    <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8481c" />
                      <stop offset="100%" stopColor="#2db563" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="url(#apptGrad)" radius={[4, 4, 0, 0]} name="Appointments" />
                </BarChart>
              </ChartCard>
            )}

            {data.monthly_orders?.length > 0 && (
              <ChartCard title="Monthly Orders & Revenue">
                <LineChart data={data.monthly_orders}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, name) => name === 'Revenue' ? `$${v}` : v} />
                  <Legend />
                  <Line yAxisId="left"  type="monotone" dataKey="count"   stroke="#263238" strokeWidth={2} dot={false} name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#e8481c" strokeWidth={2} dot={false} name="Revenue" />
                </LineChart>
              </ChartCard>
            )}

            {data.monthly_registrations?.length > 0 && (
              <ChartCard title="New Registrations">
                <BarChart data={data.monthly_registrations}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="clients" fill="#263238" radius={[4, 4, 0, 0]} name="Clients" />
                  <Bar dataKey="salons"  fill="#e8481c" radius={[4, 4, 0, 0]} name="Salons" />
                </BarChart>
              </ChartCard>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {data.top_salons?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">Top Salons</div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                      <tr>
                        {['Salon', 'City', 'Bookings', 'Revenue'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_salons.map((s) => (
                        <tr key={s.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-prima-dark">{s.name}</td>
                          <td className="px-4 py-3 text-gray-500">{s.city ?? '—'}</td>
                          <td className="px-4 py-3">{s.appointments_count}</td>
                          <td className="px-4 py-3 font-medium">${s.revenue ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {data.top_products?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">Top Products</div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                      <tr>
                        {['Product', 'Ordered', 'Revenue'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_products.map((p) => (
                        <tr key={p.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-prima-dark">{p.name}</p>
                            {p.category && <p className="text-xs text-orange-500">{p.category}</p>}
                          </td>
                          <td className="px-4 py-3">{p.total_ordered ?? 0}</td>
                          <td className="px-4 py-3 font-medium">${p.revenue ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, gradient, accent }) {
  if (gradient) return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-prima-orange to-prima-green text-white shadow-md">
      <p className="text-xs text-white/80 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
  if (accent) return (
    <div className="rounded-xl p-5 bg-orange-50 border border-orange-200">
      <p className="text-xs text-orange-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-orange-700">{value}</p>
    </div>
  )
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-prima-dark">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <p className="font-semibold text-prima-dark mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={240}>{children}</ResponsiveContainer>
    </div>
  )
}
