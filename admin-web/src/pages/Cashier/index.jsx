import { useState, useEffect, useCallback } from 'react'
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
  return Number(n).toLocaleString('ar-SY') + ' ل.س'
}

const CATEGORY_LABELS = {
  appointment: 'Appointment', product_sale: 'Product Sale', tip: 'Tip',
  supplies: 'Supplies', rent: 'Rent', salaries: 'Salaries',
  utilities: 'Utilities', maintenance: 'Maintenance', other: 'Other',
}

const IN_CATS  = ['appointment', 'product_sale', 'tip', 'other']
const OUT_CATS = ['supplies', 'rent', 'salaries', 'utilities', 'maintenance', 'other']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM = { salon_id: '', type: 'in', category: 'appointment', amount: '', note: '', date: todayStr() }

export default function Cashier() {
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
    if (!form.salon_id) { setFormError('Please select a salon.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setFormError('Enter a valid amount.'); return }
    setSaving(true); setFormError('')
    try {
      const tx = await createTransaction({ ...form, amount: Number(form.amount) })
      setTxns((prev) => [tx, ...prev])
      setShowForm(false)
      load() // refresh summary + breakdown
    } catch {
      setFormError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return
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
          <h1 className="text-2xl font-bold text-prima-dark">Cashier Overview</h1>
          <button
            onClick={openForm}
            className="bg-prima-orange hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition-colors text-sm"
          >
            + Add Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <Field label="Salon">
              <select value={salonId} onChange={(e) => setSalonId(e.target.value)} className={selectCls}>
                <option value="">All Salons</option>
                {salons.map((s) => <option key={s.id} value={s.id}>{s.salon_name}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
                <option value="">All</option>
                <option value="in">Cash In</option>
                <option value="out">Cash Out</option>
              </select>
            </Field>
            <Field label="From">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
            </Field>
            <Field label="To">
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
            </Field>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-prima-dark underline pb-2">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Total Cash In"  value={summary ? fmt(summary.total_in)  : '—'} icon="↑" color="text-prima-green" bg="bg-green-50"  border="border-prima-green/20" />
          <SummaryCard label="Total Cash Out" value={summary ? fmt(summary.total_out) : '—'} icon="↓" color="text-red-500"     bg="bg-red-50"    border="border-red-200" />
          <SummaryCard label="Net Balance"    value={summary ? fmt(summary.net)        : '—'} icon="=" color={summary && summary.net >= 0 ? 'text-prima-dark' : 'text-red-600'} bg="bg-slate-50" border="border-slate-200" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[['breakdown', 'Per-Salon Breakdown'], ['transactions', 'All Transactions']].map(([key, label]) => (
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">Loading…</div>
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
              <h2 className="font-bold text-prima-dark text-lg">Add Transaction</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-prima-dark w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Salon */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Salon</label>
                <select
                  value={form.salon_id}
                  onChange={(e) => setForm((f) => ({ ...f, salon_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                >
                  <option value="">Select salon…</option>
                  {salons.map((s) => <option key={s.id} value={s.id}>{s.salon_name}</option>)}
                </select>
              </div>

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
                    {tp === 'in' ? '↑ Cash In' : '↓ Cash Out'}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                >
                  {cats.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Amount (ل.س)</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                  placeholder="Optional note…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-prima-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-prima-orange hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors shadow">
                  {saving ? 'Saving…' : 'Save'}
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
  if (!data.length) return <EmptyState icon="💵" text="No transactions recorded yet." />
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <Th>Salon</Th>
            <Th right>Cash In</Th>
            <Th right>Cash Out</Th>
            <Th right>Net</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row) => (
            <tr key={row.salon_id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-prima-dark">{row.salon_name}</td>
              <td className="px-5 py-3.5 text-right font-bold text-prima-green">{fmt(row.total_in)}</td>
              <td className="px-5 py-3.5 text-right font-bold text-red-500">-{fmt(row.total_out)}</td>
              <td className={`px-5 py-3.5 text-right font-black ${row.net >= 0 ? 'text-prima-dark' : 'text-red-600'}`}>{fmt(row.net)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-prima-dark/5 border-t-2 border-prima-dark/10">
          <tr>
            <td className="px-5 py-3 text-xs font-bold text-prima-dark uppercase">Total</td>
            <td className="px-5 py-3 text-right font-black text-prima-green text-sm">{fmt(data.reduce((s, r) => s + r.total_in, 0))}</td>
            <td className="px-5 py-3 text-right font-black text-red-500 text-sm">-{fmt(data.reduce((s, r) => s + r.total_out, 0))}</td>
            <td className="px-5 py-3 text-right font-black text-prima-dark text-sm">{fmt(data.reduce((s, r) => s + r.net, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function TransactionTable({ rows, deletingId, onDelete }) {
  if (!rows.length) return <EmptyState icon="🧾" text="No transactions found for the selected filters." />
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <Th>Salon</Th>
            <Th>Type</Th>
            <Th>Category</Th>
            <Th right>Amount</Th>
            <Th>Note</Th>
            <Th>Date</Th>
            <Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3 font-medium text-prima-dark">{row.salon?.salon_name ?? '—'}</td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${row.type === 'in' ? 'bg-green-100 text-prima-green' : 'bg-red-100 text-red-600'}`}>
                  {row.type === 'in' ? '↑ In' : '↓ Out'}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-600">{CATEGORY_LABELS[row.category] ?? row.category}</td>
              <td className={`px-5 py-3 text-right font-bold ${row.type === 'in' ? 'text-prima-green' : 'text-red-500'}`}>
                {row.type === 'out' ? '-' : '+'}{fmt(row.amount)}
              </td>
              <td className="px-5 py-3 text-gray-400 max-w-[180px] truncate">{row.note || '—'}</td>
              <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(row.date).toLocaleDateString('en-GB')}</td>
              <td className="px-5 py-3">
                <button
                  onClick={() => onDelete(row.id)}
                  disabled={deletingId === row.id}
                  className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 text-sm"
                  title="Delete"
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
    <th className={`px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide ${right ? 'text-right' : 'text-left'}`}>
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
