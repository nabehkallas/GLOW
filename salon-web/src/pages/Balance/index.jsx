import { useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/auth'
import {
  getBalanceSummary,
  getBalanceHistory,
  getBalanceTransactions,
  createBalanceTransaction,
  deleteBalanceTransaction,
} from '../../api/balance'

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const IN_CATS  = ['product_sale', 'other']
const OUT_CATS = ['salaries', 'maintenance', 'supplies', 'other']

function pad(n) { return String(n).padStart(2, '0') }
function isoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function todayStr() { return isoDate(new Date()) }

const PRESETS = ['today', 'week', 'month', 'year', 'all']

function presetRange(key) {
  const now = new Date()
  if (key === 'today') return [todayStr(), todayStr()]
  if (key === 'week') {
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay())
    return [isoDate(start), todayStr()]
  }
  if (key === 'month') {
    return [isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), todayStr()]
  }
  if (key === 'year') {
    return [isoDate(new Date(now.getFullYear(), 0, 1)), todayStr()]
  }
  return ['', '']
}

const EMPTY_FORM = { type: 'in', category: 'product_sale', amount: '', comment: '', date: todayStr() }

export default function Balance() {
  const { t } = useTranslation()
  const { salon } = useAuthStore()

  const [summary, setSummary]     = useState(null)
  const [txns, setTxns]           = useState([])
  const [loading, setLoading]     = useState(true)

  const [history, setHistory]         = useState(null)
  const [historyMonths, setHistoryMonths] = useState(6)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const [showForm,  setShowForm]  = useState(false)
  const [form,       setForm]     = useState(EMPTY_FORM)
  const [saving,     setSaving]   = useState(false)
  const [formError,  setFormError] = useState('')

  const [deletingId, setDeletingId] = useState(null)

  const filters = {
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo   && { date_to:   dateTo }),
  }

  const load = useCallback(() => {
    if (!salon?.balance_management_enabled) return
    setLoading(true)
    Promise.all([
      getBalanceSummary(filters),
      getBalanceTransactions(filters),
    ]).then(([sum, tx]) => {
      setSummary(sum)
      setTxns(tx.data ?? [])
    }).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, salon?.balance_management_enabled])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!salon?.balance_management_enabled) return
    getBalanceHistory({ months: historyMonths }).then(setHistory)
  }, [historyMonths, salon?.balance_management_enabled])

  useEffect(() => {
    setForm((f) => ({ ...f, category: f.type === 'in' ? IN_CATS[0] : OUT_CATS[0] }))
  }, [form.type])

  const activePreset = useMemo(() => {
    if (!dateFrom && !dateTo) return 'all'
    return PRESETS.find((p) => {
      const [f, tt] = presetRange(p)
      return f === dateFrom && tt === dateTo
    }) ?? null
  }, [dateFrom, dateTo])

  if (!salon?.balance_management_enabled) return <Navigate to="/dashboard" replace />

  const openForm = () => { setForm(EMPTY_FORM); setFormError(''); setShowForm(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) { setFormError(t('balance.form.validationAmount')); return }
    setSaving(true); setFormError('')
    try {
      const tx = await createBalanceTransaction({ ...form, amount: Number(form.amount) })
      setTxns((prev) => [tx, ...prev])
      setShowForm(false)
      load()
    } catch {
      setFormError(t('balance.form.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('balance.table.deleteConfirm'))) return
    setDeletingId(id)
    try {
      await deleteBalanceTransaction(id)
      setTxns((prev) => prev.filter((r) => r.id !== id))
      load()
    } finally {
      setDeletingId(null)
    }
  }

  const clearFilters = () => { setDateFrom(''); setDateTo('') }
  const hasFilters = dateFrom || dateTo
  const cats = form.type === 'in' ? IN_CATS : OUT_CATS

  return (
    <Layout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-prima-dark">{t('nav.balance')}</h1>
          <button
            onClick={openForm}
            className="bg-prima-orange hover:bg-[#c93d15] text-white font-semibold px-5 py-2.5 rounded-xl shadow transition-colors text-sm"
          >
            {t('balance.addTransaction')}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { const [f, tt] = presetRange(p); setDateFrom(f); setDateTo(tt) }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activePreset === p
                    ? 'bg-prima-orange text-white shadow-sm'
                    : 'bg-slate-50 border border-gray-200 text-gray-500 hover:bg-slate-100'
                }`}
              >
                {t(`balance.filters.presets.${p}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <Field label={t('balance.filters.from')}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} dir="ltr" />
            </Field>
            <Field label={t('balance.filters.to')}>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} dir="ltr" />
            </Field>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-prima-dark underline pb-2">
                {t('balance.filters.clear')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label={t('balance.summary.totalIncome')}   value={summary ? fmt(summary.total_income)   : '—'} icon="↑" color="text-prima-green" bg="bg-green-50" border="border-prima-green/20" />
          <SummaryCard label={t('balance.summary.totalExpenses')} value={summary ? fmt(summary.total_expenses) : '—'} icon="↓" color="text-red-500"     bg="bg-red-50"   border="border-red-200" />
          <SummaryCard label={t('balance.summary.netBalance')}    value={summary ? fmt(summary.net_balance)    : '—'} icon="=" color={summary && summary.net_balance >= 0 ? 'text-prima-dark' : 'text-red-600'} bg="bg-slate-50" border="border-slate-200" />
        </div>

        {summary && (
          <p className="text-xs text-gray-400 -mt-2">
            {t('balance.summary.breakdown', {
              appointments: fmt(summary.appointment_income),
              manual: fmt(summary.manual_income),
            })}
          </p>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-prima-dark">{t('balance.history.title')}</p>
            <select
              value={historyMonths}
              onChange={(e) => setHistoryMonths(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              dir="ltr"
            >
              {[3, 6, 12].map((m) => <option key={m} value={m}>{t('analytics.lastMonths', { count: m })}</option>)}
            </select>
          </div>
          {!history ? (
            <p className="text-gray-400 text-sm">{t('common.loading')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="income" name={t('balance.summary.totalIncome')} stroke="#2db563" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="expenses" name={t('balance.summary.totalExpenses')} stroke="#e8481c" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">{t('common.loading')}</div>
        ) : (
          <TransactionTable rows={txns} deletingId={deletingId} onDelete={handleDelete} />
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-prima-dark text-lg">{t('balance.form.title')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-prima-dark w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
                    {tp === 'in' ? t('balance.form.income') : t('balance.form.expense')}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('balance.form.category')}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                >
                  {cats.map((c) => <option key={c} value={c}>{t(`balance.categories.${c}`)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('balance.form.amount')}</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('balance.form.date')}</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  {t('balance.form.comment')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
                </label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  rows={2}
                  placeholder={t('balance.form.commentPlaceholder')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-prima-orange hover:bg-[#c93d15] text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors shadow">
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

function TransactionTable({ rows, deletingId, onDelete }) {
  const { t } = useTranslation()
  if (!rows.length) return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
      <p className="text-4xl mb-3">💰</p>
      <p className="text-sm">{t('balance.table.noTransactions')}</p>
    </div>
  )
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <Th>{t('balance.table.type')}</Th>
              <Th>{t('balance.table.category')}</Th>
              <Th right>{t('balance.table.amount')}</Th>
              <Th>{t('balance.table.comment')}</Th>
              <Th>{t('balance.table.date')}</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${row.type === 'in' ? 'bg-green-100 text-prima-green' : 'bg-red-100 text-red-600'}`}>
                    {row.type === 'in' ? t('balance.table.in') : t('balance.table.out')}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{t(`balance.categories.${row.category}`, { defaultValue: row.category })}</td>
                <td className={`px-5 py-3 text-end font-bold ${row.type === 'in' ? 'text-prima-green' : 'text-red-500'}`}>
                  {row.type === 'out' ? '-' : '+'}{fmt(row.amount)}
                </td>
                <td className="px-5 py-3 text-gray-400 max-w-[180px] truncate">{row.comment || '—'}</td>
                <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => onDelete(row.id)}
                    disabled={deletingId === row.id}
                    className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 text-sm"
                    title={t('common.delete')}
                  >
                    {deletingId === row.id ? '…' : '✕'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm text-prima-dark focus:outline-none focus:ring-2 focus:ring-orange-400/40'
