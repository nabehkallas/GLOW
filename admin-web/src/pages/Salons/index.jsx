import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'

const STATUS_TABS = ['pending', 'approved', 'rejected']

export default function Salons() {
  const [tab, setTab] = useState('pending')
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = (s) => {
    setLoading(true)
    api.get(`admin/salons?status=${s}`)
      .then(({ data }) => setSalons(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(tab) }, [tab])

  const approve = async (id) => {
    await api.patch(`admin/salons/${id}/approve`)
    load(tab)
  }

  const openReject = (salon) => { setRejectTarget(salon); setRejectReason('') }

  const confirmReject = async () => {
    if (!rejectTarget) return
    await api.patch(`admin/salons/${rejectTarget.id}/reject`, { reason: rejectReason })
    setRejectTarget(null)
    load(tab)
  }

  const destroy = async (id) => {
    if (!confirm('Permanently delete this salon?')) return
    await api.delete(`admin/salons/${id}`)
    load(tab)
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold text-prima-dark">Salons</h1>

        <div className="flex gap-2">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                tab === s
                  ? 'bg-prima-orange text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : salons.length === 0 ? (
          <p className="text-gray-400">No {tab} salons.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                <tr>
                  {['Salon', 'Owner', 'City', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salons.map((salon) => (
                  <tr key={salon.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {salon.logo_url ? (
                          <img src={salon.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-prima-orange to-prima-green flex items-center justify-center text-white text-xs font-bold">
                            {salon.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-prima-dark">{salon.name}</p>
                          {salon.description && <p className="text-xs text-gray-400 truncate max-w-xs">{salon.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{salon.user?.name ?? '—'}<br /><span className="text-xs text-gray-400">{salon.user?.email}</span></td>
                    <td className="px-6 py-3 text-gray-600">{salon.city ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        salon.status === 'approved' ? 'bg-green-100 text-green-700' :
                        salon.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {salon.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      {salon.status === 'pending' && (
                        <>
                          <Btn color="green" onClick={() => approve(salon.id)}>Approve</Btn>
                          <Btn color="red" onClick={() => openReject(salon)}>Reject</Btn>
                        </>
                      )}
                      {salon.status === 'approved' && (
                        <Btn color="red" onClick={() => openReject(salon)}>Reject</Btn>
                      )}
                      {salon.status === 'rejected' && (
                        <Btn color="green" onClick={() => approve(salon.id)}>Approve</Btn>
                      )}
                      <Btn color="gray" onClick={() => destroy(salon.id)}>Delete</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rejectTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100">
              <h2 className="font-semibold text-prima-dark mb-3">Reject "{rejectTarget.name}"</h2>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button onClick={confirmReject} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors">Confirm Reject</button>
                <button onClick={() => setRejectTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function Btn({ children, onClick, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    red:   'bg-red-50 text-red-700 hover:bg-red-100',
    gray:  'bg-gray-100 text-gray-600 hover:bg-gray-200',
  }
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${colors[color]}`}>
      {children}
    </button>
  )
}
