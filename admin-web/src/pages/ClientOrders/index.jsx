import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import OrderDetailModal from '../../components/OrderDetailModal'
import EditOrderModal from '../../components/EditOrderModal'

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered', 'cancellation_requested', 'return_requested', 'cancelled', 'failed', 'returned']

export default function ClientOrders() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = () => {
    setLoading(true)
    const q = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`admin/client-orders${q}`)
      .then(({ data }) => setOrders(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const advance = async (id) => {
    await api.patch(`admin/client-orders/${id}/advance`)
    load()
  }

  const failOrder = async (id) => {
    if (!confirm(t('orders.failConfirm'))) return
    await api.patch(`admin/client-orders/${id}/fail`)
    load()
  }

  const returnOrder = async (id) => {
    if (!confirm(t('orders.returnConfirm'))) return
    await api.patch(`admin/client-orders/${id}/return`)
    load()
  }

  const approveReturn = async (id) => {
    await api.patch(`admin/client-orders/${id}/approve-return`)
    load()
  }

  const denyReturn = async (id) => {
    await api.patch(`admin/client-orders/${id}/deny-return`)
    load()
  }

  const approveCancellation = async (id) => {
    await api.patch(`admin/client-orders/${id}/approve-cancellation`)
    load()
  }

  const denyCancellation = async (id) => {
    await api.patch(`admin/client-orders/${id}/deny-cancellation`)
    load()
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold text-prima-dark">{t('clientOrders.title')}</h1>

        <div className="flex gap-2 flex-wrap">
          {['', ...STATUS_ORDER].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-prima-orange text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s ? t(`orders.status.${s}`) : t('common.all')}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">{t('common.loading')}</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-400">{t('orders.noOrders')}</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                <tr>
                  {[t('orders.table.order'), t('clientOrders.table.client'), t('orders.table.items'), t('orders.table.total'), t('orders.table.status'), t('common.actions')].map((h, i) => (
                    <th key={i} className="px-6 py-3 text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} onClick={() => setSelected(o)} className="border-t border-gray-100 hover:bg-slate-50/50 cursor-pointer">
                    <td className="px-6 py-3 text-gray-500 font-medium">#{o.id}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-prima-dark">{o.client?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{o.client?.email}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{t('orders.itemsCount', { count: o.items?.length ?? 0 })}</td>
                    <td className="px-6 py-3 font-bold text-prima-dark">${o.total_amount ?? '—'}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-6 py-3 flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {['pending', 'confirmed', 'shipped'].includes(o.status) && (
                        <button
                          onClick={() => advance(o.id)}
                          className="px-3 py-1 bg-prima-orange hover:bg-[#c93d15] text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                        >
                          {t('orders.advance')}
                        </button>
                      )}
                      {o.status === 'shipped' && (
                        <button
                          onClick={() => failOrder(o.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          {t('orders.fail')}
                        </button>
                      )}
                      {o.status === 'delivered' && (
                        <>
                          <button
                            onClick={() => returnOrder(o.id)}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            {t('orders.markReturned')}
                          </button>
                          <button
                            onClick={() => setEditing(o)}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            {t('orders.editOrder')}
                          </button>
                        </>
                      )}
                      {o.status === 'return_requested' && (
                        <>
                          <button
                            onClick={() => denyReturn(o.id)}
                            className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            {t('orders.denyReturn')}
                          </button>
                          <button
                            onClick={() => approveReturn(o.id)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            {t('orders.approveReturn')}
                          </button>
                        </>
                      )}
                      {o.status === 'cancellation_requested' && (
                        <>
                          <button
                            onClick={() => denyCancellation(o.id)}
                            className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            {t('orders.denyCancellation')}
                          </button>
                          <button
                            onClick={() => approveCancellation(o.id)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            {t('orders.approveCancellation')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDetailModal order={selected} type="b2c" onClose={() => setSelected(null)} />

      {editing && (
        <EditOrderModal
          order={editing}
          endpoint={`admin/client-orders/${editing.id}`}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </Layout>
  )
}

function StatusBadge({ status }) {
  const { t } = useTranslation()
  const map = {
    pending:   'bg-orange-100 text-orange-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped:   'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    failed:    'bg-slate-200 text-slate-700',
    returned:  'bg-amber-100 text-amber-700',
    return_requested: 'bg-amber-100 text-amber-700',
    cancellation_requested: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {t(`orders.status.${status}`, { defaultValue: status })}
    </span>
  )
}
