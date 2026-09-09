import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

export default function EditOrderModal({ order, endpoint, onClose, onSaved }) {
  const { t } = useTranslation()
  const [totalAmount, setTotalAmount] = useState(order.total_amount)
  const [notes, setNotes] = useState(order.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.patch(endpoint, { total_amount: Number(totalAmount), notes: notes || null })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message ?? t('orders.editFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-prima-dark mb-4">{t('orders.editOrderTitle', { id: order.id })}</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-prima-dark mb-1">{t('orders.table.total')}</label>
            <input
              type="number" step="0.01" min="0" value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-prima-dark mb-1">{t('orders.notes')}</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit" disabled={saving}
              className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
