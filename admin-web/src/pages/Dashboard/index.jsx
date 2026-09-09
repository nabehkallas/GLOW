import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2, Clock, Users, ShoppingCart, CalendarDays,
  ChevronUp, ChevronDown, Eye, Check, Trash2,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/auth'

const STATUS_COLORS = {
  pending:   'bg-orange-100 text-orange-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  failed:    'bg-slate-200 text-slate-700',
  returned:  'bg-amber-100 text-amber-700',
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const canAnalytics = user?.is_super_admin || user?.permissions?.includes('analytics')
  const canAppointments = user?.is_super_admin || user?.permissions?.includes('appointments')
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState(null)
  const [recentOrders, setRecentOrders] = useState(null)
  const [pendingAppointments, setPendingAppointments] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' })

  useEffect(() => {
    api.get('admin/dashboard').then(({ data }) => setStats(data))
    api.get('admin/orders/recent', { params: { limit: 10 } }).then(({ data }) => setRecentOrders(data.data))
    if (canAnalytics) api.get('admin/analytics', { params: { months: 6 } }).then(({ data }) => setTrends(data))
    if (canAppointments) api.get('admin/appointments', { params: { limit: 10 } }).then(({ data }) => setPendingAppointments(data.data))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const advance = async (order) => {
    const path = order.type === 'b2c' ? `admin/client-orders/${order.id}/advance` : `admin/orders/${order.id}/advance`
    await api.patch(path)
    setRecentOrders((prev) => prev.map((o) => (o.id === order.id && o.type === order.type) ? { ...o, status: nextStatus(o.status) } : o))
  }

  const removeOrder = async (order) => {
    if (order.type !== 'b2b') return // no destroy endpoint for client orders today
    if (!confirm(t('orders.cancelConfirm'))) return
    await api.patch(`admin/orders/${order.id}/cancel`)
    setRecentOrders((prev) => prev.map((o) => (o.id === order.id && o.type === order.type) ? { ...o, status: 'cancelled' } : o))
  }

  const toggleSort = (key) => {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const filteredSortedOrders = useMemo(() => {
    if (!recentOrders) return []
    let rows = statusFilter ? recentOrders.filter((o) => o.status === statusFilter) : recentOrders
    rows = [...rows].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [recentOrders, statusFilter, sort])

  // Combined appointment-vs-order volume trend, merged by month from two existing series
  const volumeTrend = useMemo(() => {
    if (!trends) return []
    const byMonth = {}
    for (const a of trends.monthly_appointments ?? []) byMonth[a.month] = { month: a.month, appointments: a.count, orders: 0 }
    for (const o of trends.monthly_orders ?? []) {
      byMonth[o.month] = byMonth[o.month] ?? { month: o.month, appointments: 0, orders: 0 }
      byMonth[o.month].orders = o.count
    }
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
  }, [trends])

  const salonSparkline = trends?.monthly_registrations?.map((m) => ({ month: m.month, salons: m.salons })) ?? []

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6">
        {!stats ? (
          <p className="text-gray-400">{t('common.loading')}</p>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Link to="/salons" className="rounded-xl p-5 bg-gradient-to-br from-prima-orange to-prima-green text-white shadow-md block hover:opacity-95 transition-opacity">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-white/80 uppercase tracking-wide">{t('dashboard.totalSalons')}</p>
                  <Building2 className="w-4 h-4 text-white/80" />
                </div>
                <p className="text-3xl font-bold mb-2">{stats.total_salons ?? '—'}</p>
                {salonSparkline.length > 1 && (
                  <div className="h-8 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salonSparkline}>
                        <Line type="monotone" dataKey="salons" stroke="#fff" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Link>

              <Link to="/salons" className="rounded-xl p-5 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors block">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-orange-600 uppercase tracking-wide">{t('dashboard.pendingApproval')}</p>
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-orange-700">{stats.pending_salons ?? '—'}</p>
              </Link>

              <StatCard icon={Users} label={t('dashboard.totalClients')} value={stats.total_clients} />
              <StatCard icon={ShoppingCart} label={t('dashboard.totalOrders')} value={stats.total_orders} />
              <StatCard icon={CalendarDays} label={t('dashboard.appointments')} value={stats.total_appointments} />
            </div>

            {/* Trend chart */}
            {canAnalytics && volumeTrend.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <p className="font-semibold text-prima-dark mb-4">{t('dashboard.volumeTrend')}</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={volumeTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="appointments" fill="#263238" radius={[4, 4, 0, 0]} name={t('analytics.seriesAppointments')} />
                    <Bar dataKey="orders" fill="#e8481c" radius={[4, 4, 0, 0]} name={t('analytics.seriesOrders')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent orders */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <p className="font-semibold text-prima-dark">{t('dashboard.recentOrders')}</p>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">{t('common.all')}</option>
                  {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned'].map((s) => (
                    <option key={s} value={s}>{t(`orders.status.${s}`)}</option>
                  ))}
                </select>
              </div>

              {!recentOrders ? (
                <p className="text-gray-400 text-sm p-6">{t('common.loading')}</p>
              ) : filteredSortedOrders.length === 0 ? (
                <p className="text-gray-400 text-sm p-6">{t('orders.noOrders')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                      <tr>
                        <SortableTh label="ID" sortKey="id" sort={sort} onSort={toggleSort} />
                        <th className="px-4 py-3 text-start">{t('dashboard.nameColumn')}</th>
                        <th className="px-4 py-3 text-start">{t('dashboard.typeColumn')}</th>
                        <SortableTh label={t('orders.table.status')} sortKey="status" sort={sort} onSort={toggleSort} />
                        <SortableTh label={t('orders.table.total')} sortKey="total_amount" sort={sort} onSort={toggleSort} />
                        <th className="px-4 py-3 text-start">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSortedOrders.map((o) => (
                        <tr key={`${o.type}-${o.id}`} className="border-t border-gray-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-gray-500 font-medium">#{o.id}</td>
                          <td className="px-4 py-3 font-medium text-prima-dark">{o.type === 'b2c' ? o.client?.name : o.salon?.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.type === 'b2c' ? 'bg-teal-100 text-teal-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {o.type === 'b2c' ? t('dashboard.typeShop') : t('dashboard.typeSalon')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {t(`orders.status.${o.status}`, { defaultValue: o.status })}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-prima-dark">${o.total_amount}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link to={o.type === 'b2c' ? '/client-orders' : '/orders'} className="text-gray-400 hover:text-prima-dark" title={t('common.view', { defaultValue: 'View' })}>
                                <Eye className="w-4 h-4" />
                              </Link>
                              {o.status !== 'delivered' && o.status !== 'cancelled' && (
                                <button onClick={() => advance(o)} className="text-blue-500 hover:text-blue-700" title={t('orders.advance')}>
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {o.type === 'b2b' && o.status === 'pending' && (
                                <button onClick={() => removeOrder(o)} className="text-red-400 hover:text-red-600" title={t('common.cancel')}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending appointments salons may have forgotten */}
            {canAppointments && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                <p className="font-semibold text-prima-dark">{t('dashboard.pendingAppointments')}</p>
              </div>

              {!pendingAppointments ? (
                <p className="text-gray-400 text-sm p-6">{t('common.loading')}</p>
              ) : pendingAppointments.length === 0 ? (
                <p className="text-gray-400 text-sm p-6">{t('dashboard.noPendingAppointments')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-start">{t('common.client')}</th>
                        <th className="px-4 py-3 text-start">{t('dashboard.salonColumn')}</th>
                        <th className="px-4 py-3 text-start">{t('common.service')}</th>
                        <th className="px-4 py-3 text-start">{t('appointments.scheduledAt')}</th>
                        <th className="px-4 py-3 text-start">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAppointments.map((a) => (
                        <tr key={a.id} className={`border-t border-gray-100 hover:bg-slate-50/50 ${a.is_stale ? 'bg-red-50/60' : ''}`}>
                          <td className="px-4 py-3 font-medium text-prima-dark">{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{a.salon?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{a.service?.name ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={a.is_stale ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {new Date(a.scheduled_at).toLocaleString()}
                            </span>
                            {a.is_stale && (
                              <span className="ms-2 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                                {t('dashboard.overdue')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {a.salon?.id && (
                              <Link to={`/salons/${a.salon.id}`} className="text-gray-400 hover:text-prima-dark" title={t('common.view', { defaultValue: 'View' })}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

function nextStatus(status) {
  return { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' }[status] ?? status
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-3xl font-bold text-prima-dark">{value ?? '—'}</p>
    </div>
  )
}

function SortableTh({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey
  return (
    <th className="px-4 py-3 text-start cursor-pointer select-none" onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  )
}
