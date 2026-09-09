import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DollarSign, CalendarDays, Clock, Star, ShoppingCart, Pencil } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/auth'

export default function Dashboard() {
  const { t } = useTranslation()
  const { salon, updateSalon } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef()

  useEffect(() => {
    Promise.all([
      api.get('/salon/analytics'),
      api.get('/salon/orders'),
    ]).then(([a, o]) => {
      setStats(a.data)
      setOrders((o.data.data ?? o.data).slice(0, 5))
    })
  }, [])

  const handleLogoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res = await api.post('/salon/profile/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateSalon({ logo_url: res.data.logo_url ?? null })
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  if (!stats) return <Layout><div className="p-4 sm:p-8 text-gray-500">{t('common.loading')}</div></Layout>

  const ov = stats.overview ?? {}
  const initial = salon?.name?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => logoInputRef.current.click()}
            disabled={uploadingLogo}
            className="relative group w-14 h-14 rounded-xl overflow-hidden shrink-0 focus:outline-none"
            title={t('profile.changeLogo')}
          >
            {salon?.logo_url ? (
              <img src={salon.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-prima-dark flex items-center justify-center">
                <span className="text-white text-xl font-black">{initial}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              {uploadingLogo
                ? <span className="text-white text-[10px] font-semibold">{t('common.saving')}</span>
                : <Pencil className="w-4 h-4 text-white" />
              }
            </div>
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleLogoChange}
          />
          <div>
            <h1 className="text-2xl font-bold text-prima-dark">{t('dashboard.title')}</h1>
            {salon?.name && <p className="text-sm text-gray-400">{salon.name}</p>}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-br from-prima-orange to-prima-green text-white shadow-md">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-white/80">{t('dashboard.thisMonthRevenue')}</p>
              <DollarSign className="w-4 h-4 text-white/80" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mb-1">${ov.this_month_revenue ?? 0}</p>
            {stats.monthly_revenue?.length > 1 && (
              <div className="h-7 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthly_revenue}>
                    <Line type="monotone" dataKey="revenue" stroke="#fff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <StatCard icon={CalendarDays} label={t('dashboard.totalAppointments')} value={ov.total_appointments ?? 0} />

          <Link to="/appointments" className="rounded-xl p-4 sm:p-5 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors block">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-orange-600">{t('dashboard.pending')}</p>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-orange-700">{ov.pending_appointments ?? 0}</p>
          </Link>

          <StatCard icon={Star} label={t('dashboard.avgRating')} value={salon?.average_rating ?? '—'} />
        </div>

        {/* Trend + breakdown charts */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {stats.monthly_revenue?.length > 0 && (
            <ChartCard title={t('analytics.monthlyRevenue')}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.monthly_revenue}>
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
              </ResponsiveContainer>
            </ChartCard>
          )}
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

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-prima-dark flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gray-400" /> {t('dashboard.recentOrders')}
              </span>
              <Link to="/orders?tab=orders" className="text-xs text-prima-orange hover:underline">{t('dashboard.viewAll')}</Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-gray-400 text-sm px-4 sm:px-6 py-6">{t('orders.noOrders')}</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <div key={o.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-prima-dark truncate">{t('orders.orderNumber', { id: o.id })}</p>
                      <p className="text-xs text-gray-400 truncate">{t('orders.itemsCount', { count: o.items?.length ?? 0 })}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(o.status)}`}>
                        {t('status.' + o.status)}
                      </span>
                      <span className="text-sm font-bold text-prima-dark">${o.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent appointments */}
          {stats.recent_appointments?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 font-semibold text-prima-dark">
                {t('dashboard.recentAppointments')}
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {stats.recent_appointments.map((a) => (
                  <div key={a.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-prima-dark truncate">{a.client?.name ?? a.client_name ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{a.service?.name ?? '—'} · {new Date(a.scheduled_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor(a.status)}`}>
                      {t('status.' + a.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl p-4 sm:p-5 bg-white border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      </div>
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
    delivered: 'bg-green-100 text-green-700',
    shipped:   'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
    failed:    'bg-slate-200 text-slate-700',
    returned:  'bg-amber-100 text-amber-700',
  }[s] ?? 'bg-gray-100 text-gray-600'
}
