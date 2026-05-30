import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import {
  getCashierSummary,
  getCashierTransactions,
  createTransaction,
  deleteTransaction,
} from '../api/cashier'

const IN_CATEGORIES = ['appointment', 'product_sale', 'tip', 'other']
const OUT_CATEGORIES = ['supplies', 'rent', 'salaries', 'utilities', 'maintenance', 'other']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function fmt(n) {
  return Number(n).toLocaleString('ar-SY') + ' ل.س'
}

export default function Cashier() {
  const { t } = useTranslation()

  // summary for selected day
  const [summaryDate, setSummaryDate] = useState(todayStr())
  const [summary, setSummary] = useState(null)

  // transaction list filters
  const [filterType, setFilterType] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [rows, setRows] = useState([])
  const [listLoading, setListLoading] = useState(true)

  // add-transaction modal
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'in', category: 'appointment', amount: '', note: '', date: todayStr() })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // delete confirmation
  const [deletingId, setDeletingId] = useState(null)

  const loadSummary = useCallback(() => {
    getCashierSummary(summaryDate).then(setSummary).catch(() => {})
  }, [summaryDate])

  const loadList = useCallback(() => {
    setListLoading(true)
    const filters = {}
    if (filterType) filters.type = filterType
    if (filterFrom) filters.date_from = filterFrom
    if (filterTo)   filters.date_to   = filterTo
    getCashierTransactions(filters)
      .then(setRows)
      .finally(() => setListLoading(false))
  }, [filterType, filterFrom, filterTo])

  useEffect(() => { loadSummary() }, [loadSummary])
  useEffect(() => { loadList() }, [loadList])

  // sync form category when type changes
  useEffect(() => {
    setForm((f) => ({
      ...f,
      category: f.type === 'in' ? IN_CATEGORIES[0] : OUT_CATEGORIES[0],
    }))
  }, [form.type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError(t('cashier.invalidAmount'))
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const tx = await createTransaction({ ...form, amount: Number(form.amount) })
      setRows((prev) => [tx, ...prev])
      setShowForm(false)
      setForm({ type: 'in', category: IN_CATEGORIES[0], amount: '', note: '', date: todayStr() })
      if (tx.date === summaryDate) loadSummary()
    } catch {
      setFormError(t('cashier.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteTransaction(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      loadSummary()
    } finally {
      setDeletingId(null)
    }
  }

  const categories = form.type === 'in' ? IN_CATEGORIES : OUT_CATEGORIES

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-prima-dark">{t('cashier.title')}</h1>
          <button
            onClick={() => { setShowForm(true); setFormError('') }}
            className="bg-prima-orange hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition-colors text-sm"
          >
            + {t('cashier.addTransaction')}
          </button>
        </div>

        {/* ── Daily summary ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <span className="font-semibold text-prima-dark">{t('cashier.dailySummary')}</span>
            <input
              type="date"
              value={summaryDate}
              max={todayStr()}
              onChange={(e) => setSummaryDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-prima-dark focus:outline-none focus:ring-2 focus:ring-prima-orange/40"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard
              label={t('cashier.totalIn')}
              value={summary ? fmt(summary.total_in) : '—'}
              color="text-prima-green"
              bg="bg-green-50"
              icon="↑"
            />
            <SummaryCard
              label={t('cashier.totalOut')}
              value={summary ? fmt(summary.total_out) : '—'}
              color="text-red-500"
              bg="bg-red-50"
              icon="↓"
            />
            <SummaryCard
              label={t('cashier.net')}
              value={summary ? fmt(summary.net) : '—'}
              color={summary && summary.net >= 0 ? 'text-prima-dark' : 'text-red-600'}
              bg="bg-slate-50"
              icon="="
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('cashier.filterType')}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-prima-dark focus:outline-none focus:ring-2 focus:ring-prima-orange/40"
            >
              <option value="">{t('cashier.all')}</option>
              <option value="in">{t('cashier.cashIn')}</option>
              <option value="out">{t('cashier.cashOut')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('cashier.from')}</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-prima-dark focus:outline-none focus:ring-2 focus:ring-prima-orange/40"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('cashier.to')}</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-prima-dark focus:outline-none focus:ring-2 focus:ring-prima-orange/40"
            />
          </div>
          {(filterType || filterFrom || filterTo) && (
            <button
              onClick={() => { setFilterType(''); setFilterFrom(''); setFilterTo('') }}
              className="text-xs text-slate-400 hover:text-prima-dark underline self-end pb-2"
            >
              {t('cashier.clearFilters')}
            </button>
          )}
        </div>

        {/* ── Transaction list ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {listLoading ? (
            <div className="p-10 text-center text-slate-400 text-sm">{t('common.loading')}</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <p className="text-4xl mb-3">💵</p>
              <p className="text-sm">{t('cashier.empty')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('cashier.type')}</th>
                  <th className="px-5 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('common.category')}</th>
                  <th className="px-5 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('cashier.amount')}</th>
                  <th className="px-5 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('common.notes')}</th>
                  <th className="px-5 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('cashier.date')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 text-end">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${row.type === 'in' ? 'bg-green-100 text-prima-green' : 'bg-red-100 text-red-600'}`}>
                        {row.type === 'in' ? '↑' : '↓'} {t(`cashier.${row.type === 'in' ? 'cashIn' : 'cashOut'}`)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-end text-prima-dark font-medium">
                      {t(`cashier.cat.${row.category}`, { defaultValue: row.category })}
                    </td>
                    <td className={`px-5 py-3 text-end font-bold ${row.type === 'in' ? 'text-prima-green' : 'text-red-600'}`}>
                      {row.type === 'out' ? '-' : '+'}{fmt(row.amount)}
                    </td>
                    <td className="px-5 py-3 text-end text-slate-500 max-w-[180px] truncate">
                      {row.note || '—'}
                    </td>
                    <td className="px-5 py-3 text-end text-slate-400 text-xs whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString('ar-SY')}
                    </td>
                    <td className="px-5 py-3 text-end">
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        title={t('common.delete')}
                      >
                        {deletingId === row.id ? '…' : '✕'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add transaction modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-prima-dark text-lg">{t('cashier.addTransaction')}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-prima-dark w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Type */}
              <div className="flex gap-3">
                {['in', 'out'].map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: tp }))}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 transition-colors ${
                      form.type === tp
                        ? tp === 'in'
                          ? 'border-prima-green bg-green-50 text-prima-green'
                          : 'border-red-400 bg-red-50 text-red-600'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {tp === 'in' ? `↑ ${t('cashier.cashIn')}` : `↓ ${t('cashier.cashOut')}`}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('common.category')}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-prima-orange/40"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{t(`cashier.cat.${c}`, { defaultValue: c })}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('cashier.amount')} (ل.س)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-prima-orange/40"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('cashier.date')}</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-prima-orange/40"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  {t('common.notes')} <span className="text-slate-400 font-normal">({t('common.optional')})</span>
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                  placeholder={t('cashier.notePlaceholder')}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-prima-orange/40"
                />
              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-prima-orange hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors shadow"
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function SummaryCard({ label, value, color, bg, icon }) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <div className={`text-2xl font-black ${color} mb-1`}>{value}</div>
      <div className="text-xs text-slate-400 font-medium">{icon} {label}</div>
    </div>
  )
}
