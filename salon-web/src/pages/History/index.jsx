import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function History() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('appointments')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appointments, setAppointments] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = { date_from: dateFrom || undefined, date_to: dateTo || undefined }
    if (tab === 'appointments') {
      api.get('/salon/appointments', { params })
        .then(({ data }) => setAppointments(data.data ?? data))
        .finally(() => setLoading(false))
    } else {
      api.get('/salon/orders', { params })
        .then(({ data }) => setOrders(data.data ?? data))
        .finally(() => setLoading(false))
    }
  }, [tab, dateFrom, dateTo])

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-prima-dark">{t('history.title')}</h1>

        <div className="flex gap-2">
          {['appointments', 'orders'].map((tKey) => (
            <button
              key={tKey}
              onClick={() => setTab(tKey)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === tKey
                  ? 'bg-prima-orange text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tKey === 'appointments' ? t('nav.appointments') : t('nav.orders')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Field label={t('appointments.dateFrom')}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              dir="ltr"
            />
          </Field>
          <Field label={t('appointments.dateTo')}>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              dir="ltr"
            />
          </Field>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className="text-xs text-gray-400 hover:text-prima-dark underline pb-2"
            >
              {t('appointments.clearDates')}
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">{t('common.loading')}</p>
        ) : tab === 'appointments' ? (
          <AppointmentsHistory appointments={appointments} t={t} />
        ) : (
          <OrdersHistory orders={orders} t={t} />
        )}
      </div>
    </Layout>
  )
}

function AppointmentsHistory({ appointments, t }) {
  if (appointments.length === 0) {
    return <p className="text-gray-400">{t('history.noAppointments')}</p>
  }
  return (
    <>
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
              <tr>
                {[t('common.client'), t('common.service'), t('appointments.scheduledAt'), t('common.price'), t('common.status')].map((h) => (
                  <th key={h} className="px-6 py-3 text-start">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                  <td className="px-6 py-3">{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</td>
                  <td className="px-6 py-3">{a.service?.name ?? (a.source === 'manual' ? t('appointments.other') : '—')}</td>
                  <td className="px-6 py-3">{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td className="px-6 py-3 font-semibold text-prima-dark">${a.price_at_booking}</td>
                  <td className="px-6 py-3"><StatusBadge status={a.status} t={t} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="sm:hidden space-y-3">
        {appointments.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-prima-dark text-sm">{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.service?.name ?? (a.source === 'manual' ? t('appointments.other') : '—')}</p>
              </div>
              <StatusBadge status={a.status} t={t} />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(a.scheduled_at).toLocaleString()}</span>
              <span className="font-semibold text-prima-dark">${a.price_at_booking}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function OrdersHistory({ orders, t }) {
  if (orders.length === 0) {
    return <p className="text-gray-400">{t('history.noOrders')}</p>
  }
  return (
    <div className="space-y-4 max-w-2xl">
      {orders.map((o) => (
        <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-prima-dark">{t('orders.orderNumber', { id: o.id })}</span>
            <StatusBadge status={o.status} t={t} />
          </div>
          <div className="text-sm text-gray-600 space-y-1.5 pt-3 border-t border-gray-100">
            {o.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt="" className="w-7 h-7 rounded object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-slate-100 shrink-0" />
                  )}
                  <span>{item.product?.name ?? `Product #${item.product_id}`} × {item.quantity}</span>
                </div>
                <span className="font-medium">${item.unit_price}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-prima-dark">
            <span>{t('common.total')}</span>
            <span>${o.total_amount}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status, t }) {
  const map = {
    pending:   'bg-orange-100 text-orange-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    shipped:   'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {t('status.' + status)}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-prima-dark mb-1">{label}</label>
      {children}
    </div>
  )
}
