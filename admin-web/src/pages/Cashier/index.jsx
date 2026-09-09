import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '../../components/Layout'
import {
  getCashierSummary,
  getCashierTransactions,
  getSalonBreakdown,
  getSalons,
  createTransaction,
  deleteTransaction,
} from '../../api/cashier'

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const IN_CATS  = ['product_sale', 'tip', 'other']
const OUT_CATS = ['supplies', 'rent', 'salaries', 'utilities', 'maintenance', 'other']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM = { type: 'in', category: 'product_sale', amount: '', note: '', date: todayStr() }

export default function Cashier() {
  const { t } = useTranslation()
  const [salons, setSalons]       = useState([])
  const [summary, setSummary]     = useState(null)
  const [breakdown, setBreakdown] = useState([])
  const [txns, setTxns]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('breakdown')

  // filters
  const [salonId,     setSalonId]     = useState('')
  const [filterType,  setFilterType]  = useState('')
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')

  // add-transaction modal
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState('')

  // delete
  const [deletingId, setDeletingId] = useState(null)

  const filters = {
    ...(salonId    && { salon_id:  salonId }),
    ...(filterType && { type:      filterType }),
    ...(dateFrom   && { date_from: dateFrom }),
    ...(dateTo     && { date_to:   dateTo }),
  }

  const load = useCallback(() => {
    setLoading(true)
    const bdParams = {
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo   && { date_to:   dateTo }),
    }
    Promise.all([
      getCashierSummary(filters),
      getSalonBreakdown(bdParams),
      getCashierTransactions(filters),
    ]).then(([sum, bd, tx]) => {
      setSummary(sum)
      setBreakdown(bd)
      setTxns(tx.data ?? [])
    }).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, filterType, dateFrom, dateTo])

  useEffect(() => {
    getSalons().then((d) => setSalons(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => { load() }, [load])

  // keep category in sync when type changes in form
  useEffect(() => {
    setForm((f) => ({ ...f, category: f.type === 'in' ? IN_CATS[0] : OUT_CATS[0] }))
  }, [form.type])

  const openForm = () => { setForm(EMPTY_FORM); setFormError(''); setShowForm(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) { setFormError(t('cashier.form.validationAmount')); return }
    setSaving(true); setFormError('')
    try {
      const tx = await createTransaction({ ...form, amount: Number(form.amount) })
      setTxns((prev) => [tx, ...prev])
      setShowForm(false)
      load() // refresh summary + breakdown
    } catch {
      setFormError(t('cashier.form.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('cashier.table.deleteConfirm'))) return
    setDeletingId(id)
    try {
      await deleteTransaction(id)
      setTxns((prev) => prev.filter((r) => r.id !== id))
      load()
    } finally {
      setDeletingId(null)
    }
  }

  const clearFilters = () => { setSalonId(''); setFilterType(''); setDateFrom(''); setDateTo('') }
  const hasFilters = salonId || filterType || dateFrom || dateTo
  const cats = form.type === 'in' ? IN_CATS : OUT_CATS

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-prima-dark">{t('cashier.title')}</h1>
          <button
            onClick={openForm}
            className="bg-prima-orange hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition-colors text-sm"
          >
            {t('cashier.addTransaction')}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <Field label={t('cashier.filters.salon')}>
              <select value={salonId} onChange={(e) => setSalonId(e.target.value)} className={selectCls}>
                <option value="">{t('cashier.filters.allSalons')}</option>
                {salons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label={t('cashier.filters.type')}>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
                <option value="">{t('common.all')}</option>
                <option value="in">{t('cashier.filters.cashIn')}</option>
                <option value="out">{t('cashier.filters.cashOut')}</option>
              </select>
            </Field>
            <Field label={t('cashier.filters.from')}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
            </Field>
            <Field label={t('cashier.filters.to')}>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
            </Field>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-prima-dark underline pb-2">
                {t('cashier.filters.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label={t('cashier.summary.totalCashIn')}  value={summary ? fmt(summary.total_in)  : '—'} icon="↑" color="text-prima-green" bg="bg-green-50"  border="border-prima-green/20" />
          <SummaryCard label={t('cashier.summary.totalCashOut')} value={summary ? fmt(summary.total_out) : '—'} icon="↓" color="text-red-500"     bg="bg-red-50"    border="border-red-200" />
          <SummaryCard label={t('cashier.summary.netBalance')}   value={summary ? fmt(summary.net)        : '—'} icon="=" color={summary && summary.net >= 0 ? 'text-prima-dark' : 'text-red-600'} bg="bg-slate-50" border="border-slate-200" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[['breakdown', t('cashier.tabs.breakdown')], ['transactions', t('cashier.tabs.transactions')]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-white text-prima-dark shadow-sm' : 'text-gray-400 hover:text-prima-dark'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">{t('common.loading')}</div>
        ) : tab === 'breakdown' ? (
          <BreakdownTable data={breakdown} />
        ) : (
          <TransactionTable rows={txns} deletingId={deletingId} onDelete={handleDelete} />
        )}
      </div>

      {/* Add Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-prima-dark text-lg">{t('cashier.form.title')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-prima-dark w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Type toggle */}
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
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {tp === 'in' ? t('cashier.form.cashIn') : t('cashier.form.cashOut')}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('cashier.form.category')}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                >
                  {cats.map((c) => <option key={c} value={c}>{t(`cashier.categories.${c}`)}</option>)}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('cashier.form.amount')}</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('cashier.form.date')}</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('cashier.form.note')} <span className="text-gray-400 font-normal">({t('common.optional')})</span></label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                  placeholder={t('cashier.form.notePlaceholder')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-prima-orange hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors shadow">
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

/* ── Sub-components ── */

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

function SummaryCard({ label, value, icon, color, bg, border }) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-5 text-center shadow-sm`}>
      <div className={`text-2xl font-black ${color} mb-1`}>{value}</div>
      <div className="text-xs text-gray-400 font-medium">{icon} {label}</div>
    </div>
  )
}

function BreakdownTable({ data }) {
  const { t } = useTranslation()
  if (!data.length) return <EmptyState icon="💵" text={t('cashier.table.noBreakdown')} />
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <Th>{t('cashier.table.salon')}</Th>
            <Th right>{t('cashier.filters.cashIn')}</Th>
            <Th right>{t('cashier.filters.cashOut')}</Th>
            <Th right>{t('cashier.summary.netBalance')}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row) => (
            <tr key={row.salon_id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-prima-dark">{row.salon_name}</td>
              <td className="px-5 py-3.5 text-end font-bold text-prima-green">{fmt(row.total_in)}</td>
              <td className="px-5 py-3.5 text-end font-bold text-red-500">-{fmt(row.total_out)}</td>
              <td className={`px-5 py-3.5 text-end font-black ${row.net >= 0 ? 'text-prima-dark' : 'text-red-600'}`}>{fmt(row.net)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-prima-dark/5 border-t-2 border-prima-dark/10">
          <tr>
            <td className="px-5 py-3 text-xs font-bold text-prima-dark uppercase">{t('cashier.table.total')}</td>
            <td className="px-5 py-3 text-end font-black text-prima-green text-sm">{fmt(data.reduce((s, r) => s + r.total_in, 0))}</td>
            <td className="px-5 py-3 text-end font-black text-red-500 text-sm">-{fmt(data.reduce((s, r) => s + r.total_out, 0))}</td>
            <td className="px-5 py-3 text-end font-black text-prima-dark text-sm">{fmt(data.reduce((s, r) => s + r.net, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function TransactionTable({ rows, deletingId, onDelete }) {
  const { t } = useTranslation()
  if (!rows.length) return <EmptyState icon="🧾" text={t('cashier.table.noTransactions')} />
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <Th>{t('cashier.table.salon')}</Th>
            <Th>{t('cashier.table.type')}</Th>
            <Th>{t('cashier.table.category')}</Th>
            <Th right>{t('cashier.table.amount')}</Th>
            <Th>{t('cashier.table.note')}</Th>
            <Th>{t('cashier.table.date')}</Th>
            <Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3 font-medium text-prima-dark">{row.salon?.name ?? '—'}</td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${row.type === 'in' ? 'bg-green-100 text-prima-green' : 'bg-red-100 text-red-600'}`}>
                  {row.type === 'in' ? t('cashier.table.in') : t('cashier.table.out')}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-600">{t(`cashier.categories.${row.category}`, { defaultValue: row.category })}</td>
              <td className={`px-5 py-3 text-end font-bold ${row.type === 'in' ? 'text-prima-green' : 'text-red-500'}`}>
                {row.type === 'out' ? '-' : '+'}{fmt(row.amount)}
              </td>
              <td className="px-5 py-3 text-gray-400 max-w-[180px] truncate">{row.note || '—'}</td>
              <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(row.date).toLocaleDateString('en-GB')}</td>
              <td className="px-5 py-3">
                <button
                  onClick={() => onDelete(row.id)}
                  disabled={deletingId === row.id}
                  className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 text-sm"
                  title={t('cashier.table.delete')}
                >
                  {deletingId === row.id ? '…' : '✕'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, right }) {
  return (
    <th className={`px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide ${right ? 'text-end' : 'text-start'}`}>
      {children}
    </th>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm">{text}</p>
    </div>
  )
}

const selectCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm text-prima-dark focus:outline-none focus:ring-2 focus:ring-orange-400/40'
const inputCls  = 'border border-gray-200 rounded-lg px-3 py-2 text-sm text-prima-dark focus:outline-none focus:ring-2 focus:ring-orange-400/40'
