import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  pending:   'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Clients() {
  const { t } = useTranslation()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    api.get('/salon/clients').then(({ data }) => {
      setClients(data.data ?? data)
      setLoading(false)
    })
  }, [])

  const openDetail = async (client) => {
    setSelected(client)
    setDetail(null)
    setDetailLoading(true)
    try {
      let res
      if (client.type === 'app') {
        res = await api.get(`/salon/clients/app/${client.user_id}`)
      } else {
        res = await api.get('/salon/clients/walkin', { params: { name: client.name } })
      }
      setDetail(res.data.data)
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // Summary stats
  const totalClients    = clients.length
  const appClients      = clients.filter((c) => c.type === 'app').length
  const walkinClients   = clients.filter((c) => c.type === 'walkin').length
  const totalRevenue    = clients.reduce((s, c) => s + c.total_spent, 0)

  return (
    <Layout>
      <div className="flex h-full">

        {/* ── Left panel: list ── */}
        <div className={`flex flex-col flex-1 min-w-0 transition-all ${selected ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 sm:p-8 space-y-6">

            {/* Header */}
            <h1 className="text-2xl font-bold text-prima-dark">{t('clients.title')}</h1>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label={t('clients.totalClients')} value={totalClients} color="prima-dark" />
              <StatCard label={t('clients.appClients')}   value={appClients}   color="blue-600" />
              <StatCard label={t('clients.walkInClients')} value={walkinClients} color="orange-500" />
              <StatCard label={t('clients.totalRevenue')} value={`$${totalRevenue.toFixed(2)}`} color="prima-green" />
            </div>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('clients.searchPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />

            {/* Client list */}
            {loading ? (
              <p className="text-center text-gray-400 py-12">{t('common.loading')}</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-12">{t('clients.empty')}</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((client, i) => (
                  <ClientRow
                    key={`${client.type}-${client.user_id ?? client.name}-${i}`}
                    client={client}
                    active={selected?.type === client.type && (selected?.user_id === client.user_id || selected?.name === client.name)}
                    onClick={() => openDetail(client)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: detail drawer ── */}
        {selected && (
          <div className="flex flex-col w-full md:w-[420px] shrink-0 bg-white border-s border-gray-100 overflow-y-auto">
            <DetailPanel
              client={selected}
              detail={detail}
              loading={detailLoading}
              onClose={() => { setSelected(null); setDetail(null) }}
              t={t}
            />
          </div>
        )}

      </div>
    </Layout>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold text-${color}`}>{value}</p>
    </div>
  )
}

function ClientRow({ client, active, onClick, t }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-start flex items-center gap-4 bg-white border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all ${
        active ? 'border-prima-orange ring-1 ring-prima-orange' : 'border-gray-100'
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-prima-orange to-prima-green flex items-center justify-center text-white font-semibold text-sm shrink-0">
        {client.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-prima-dark text-sm truncate">{client.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
            client.type === 'app'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {client.type === 'app' ? t('clients.app') : t('clients.walkIn')}
          </span>
        </div>
        {client.email && <p className="text-xs text-gray-400 truncate mt-0.5">{client.email}</p>}
        <p className="text-xs text-gray-400 mt-0.5">
          {t('clients.visits', { count: client.total_visits })} · {t('clients.lastVisit')}: {new Date(client.last_visit).toLocaleDateString()}
        </p>
      </div>

      {/* Spent */}
      <div className="text-end shrink-0">
        <p className="font-bold text-prima-dark text-sm">${client.total_spent.toFixed(2)}</p>
        <p className="text-xs text-gray-400">{t('clients.spent')}</p>
      </div>

      {/* Chevron */}
      <svg className="w-4 h-4 text-gray-300 shrink-0 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

function DetailPanel({ client, detail, loading, onClose, t }) {
  return (
    <>
      {/* Panel header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
        <button onClick={onClose} className="text-gray-400 hover:text-prima-dark transition-colors rtl:rotate-180">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-prima-dark truncate">{client.name}</p>
          {client.email && <p className="text-xs text-gray-400 truncate">{client.email}</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          client.type === 'app' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {client.type === 'app' ? t('clients.app') : t('clients.walkIn')}
        </span>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-16">{t('common.loading')}</p>
      ) : detail ? (
        <div className="p-5 space-y-5">

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={t('clients.totalVisits')}     value={detail.stats.total_visits}     />
            <MiniStat label={t('clients.completed')}       value={detail.stats.completed_visits}  color="text-green-600" />
            <MiniStat label={t('clients.cancelled')}       value={detail.stats.cancelled_visits}  color="text-red-500" />
            <MiniStat label={t('clients.upcoming')}        value={detail.stats.pending_visits}    color="text-blue-600" />
            <div className="col-span-2">
              <MiniStat label={t('clients.totalSpent')} value={`$${detail.stats.total_spent.toFixed(2)}`} color="text-prima-green" large />
            </div>
          </div>

          {/* Timeline */}
          {detail.stats.first_visit && (
            <div className="text-xs text-gray-400 flex gap-4">
              <span>{t('clients.firstVisit')}: <strong className="text-prima-dark">{new Date(detail.stats.first_visit).toLocaleDateString()}</strong></span>
              <span>{t('clients.lastVisit')}: <strong className="text-prima-dark">{new Date(detail.stats.last_visit).toLocaleDateString()}</strong></span>
            </div>
          )}

          {/* Appointment history */}
          <div>
            <p className="text-sm font-semibold text-prima-dark mb-3">{t('clients.history')}</p>
            <div className="space-y-2">
              {detail.appointments.length === 0 ? (
                <p className="text-sm text-gray-400">{t('clients.noHistory')}</p>
              ) : (
                detail.appointments.map((appt) => (
                  <div key={appt.id} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-prima-dark">
                          {appt.service?.name ?? t('appointments.other')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(appt.scheduled_at).toLocaleString()}
                        </p>
                        {appt.notes && <p className="text-xs text-gray-500 mt-1 italic">"{appt.notes}"</p>}
                      </div>
                      <div className="text-end shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {t(`status.${appt.status}`)}
                        </span>
                        {appt.price_at_booking > 0 && (
                          <p className="text-sm font-semibold text-prima-dark mt-1">${appt.price_at_booking}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function MiniStat({ label, value, color = 'text-prima-dark', large }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`font-bold ${large ? 'text-xl' : 'text-lg'} ${color}`}>{value}</p>
    </div>
  )
}
