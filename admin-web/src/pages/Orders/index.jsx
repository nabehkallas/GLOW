import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    setLoading(true)
    const q = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`admin/orders${q}`)
      .then(({ data }) => setOrders(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const advance = async (id) => {
    await api.patch(`admin/orders/${id}/advance`)
    load()
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold text-prima-dark">Orders</h1>

        <div className="flex gap-2 flex-wrap">
          {['', ...STATUS_ORDER].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-prima-orange text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-400">No orders found.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                <tr>
                  {['Order', 'Salon', 'Items', 'Total', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-gray-500 font-medium">#{o.id}</td>
                    <td className="px-6 py-3 font-medium text-prima-dark">{o.salon?.name ?? '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{o.items?.length ?? 0} item(s)</td>
                    <td className="px-6 py-3 font-bold text-prima-dark">${o.total_amount ?? '—'}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-6 py-3">
                      {o.status !== 'delivered' && (
                        <button
                          onClick={() => advance(o.id)}
                          className="px-3 py-1 bg-prima-orange hover:bg-[#c93d15] text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                        >
                          Advance →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending:   'bg-orange-100 text-orange-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped:   'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
