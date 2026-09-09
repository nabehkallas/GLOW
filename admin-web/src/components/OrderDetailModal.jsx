import { useTranslation } from 'react-i18next'

export default function OrderDetailModal({ order, type, onClose }) {
  const { t } = useTranslation()
  if (!order) return null

  const who = type === 'b2b'
    ? { name: order.salon?.user?.name ?? order.salon?.name ?? '—', sub: order.salon?.user?.email }
    : { name: order.client?.name ?? '—', sub: order.client?.email }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-prima-dark">{t('orders.orderNumber', { id: order.id })}</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {who.name}{who.sub ? ` · ${who.sub}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-prima-dark">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.product?.image_url ? (
                <img src={item.product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-prima-dark truncate">
                  {item.product?.name ?? `Product #${item.product_id}`}
                </p>
                {item.variant && (
                  <p className="text-xs text-gray-400 truncate">
                    {(item.variant.attribute_values ?? []).map((av) => av.value).join(' / ')}
                  </p>
                )}
                <p className="text-xs text-gray-400">{item.quantity} × ${item.unit_price}</p>
              </div>
              <p className="text-sm font-semibold text-prima-dark shrink-0">${item.subtotal}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 space-y-2">
          {order.notes && (
            <div>
              <p className="text-xs text-gray-400">{t('orders.notes')}</p>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
          {order.return_reason && (
            <div>
              <p className="text-xs text-gray-400">{t('orders.returnReason')}</p>
              <p className="text-sm text-amber-600">{order.return_reason}</p>
            </div>
          )}
          {order.cancellation_reason && (
            <div>
              <p className="text-xs text-gray-400">{t('orders.cancelReason')}</p>
              <p className="text-sm text-amber-600">{order.cancellation_reason}</p>
            </div>
          )}
          <div className="flex items-center justify-between text-sm font-bold text-prima-dark pt-1">
            <span>{t('orders.table.total')}</span>
            <span>${order.total_amount}</span>
          </div>
        </div>
      </div>
    </div>
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
