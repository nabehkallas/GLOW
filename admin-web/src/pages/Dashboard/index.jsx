import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('admin/dashboard').then(({ data }) => setStats(data))
  }, [])

  const cards = stats
    ? [
        { label: 'Total Salons',     value: stats.total_salons       ?? '—', gradient: true },
        { label: 'Pending Approval', value: stats.pending_salons     ?? '—', accent: true  },
        { label: 'Total Clients',    value: stats.total_clients      ?? '—' },
        { label: 'Total Orders',     value: stats.total_orders       ?? '—' },
        { label: 'Appointments',     value: stats.total_appointments ?? '—' },
      ]
    : []

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold text-prima-dark">Dashboard</h1>

        {!stats ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(({ label, value, gradient, accent }) => (
              <StatCard key={label} label={label} value={value} gradient={gradient} accent={accent} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, gradient, accent }) {
  if (gradient) return (
    <div className="rounded-xl p-6 bg-gradient-to-br from-prima-orange to-prima-green text-white shadow-md">
      <p className="text-xs text-white/80 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
  if (accent) return (
    <div className="rounded-xl p-6 bg-orange-50 border border-orange-200">
      <p className="text-xs text-orange-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-orange-700">{value}</p>
    </div>
  )
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-prima-dark">{value}</p>
    </div>
  )
}
