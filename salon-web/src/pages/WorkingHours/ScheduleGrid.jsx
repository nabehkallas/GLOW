import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../api/axios'
import Modal from '../../components/Modal'
import WalkInForm from '../../components/WalkInForm'
import WalkInOrBlockChoice from '../../components/WalkInOrBlockChoice'
import BlockForm from '../../components/BlockForm'

const SLOT_MINUTES = 30
const DEFAULT_START = 8 * 60   // 08:00 fallback when every day is closed/unset
const DEFAULT_END = 20 * 60    // 20:00 fallback

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function pad(n) { return String(n).padStart(2, '0') }

function fromMinutes(mins) {
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`
}

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getWeekStart(offset) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay() + offset * 7)
  return d
}

export default function ScheduleGrid({ schedule }) {
  const { t } = useTranslation()
  const [weekOffset, setWeekOffset] = useState(0)
  const [appointments, setAppointments] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  // modal shapes: { type: 'choice', defaultScheduledAt } | { type: 'walkin', defaultScheduledAt }
  // | { type: 'block', defaultScheduledAt } | { type: 'detail', appointment } | { type: 'blockDetail', block }

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    }),
    [weekStart]
  )

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 6)
    return d
  }, [weekStart])

  const fetchWeekData = () => Promise.all([
    api.get('/salon/appointments', {
      params: { date_from: isoDate(weekStart), date_to: isoDate(weekEnd), status: 'all', per_page: 200 },
    }),
    api.get('/salon/schedule-blocks', {
      params: { date_from: isoDate(weekStart), date_to: isoDate(weekEnd) },
    }),
  ]).then(([apptRes, blockRes]) => {
    setAppointments(apptRes.data.data ?? apptRes.data)
    setBlocks(blockRes.data.data ?? blockRes.data)
  })

  useEffect(() => {
    setLoading(true)
    fetchWeekData().finally(() => setLoading(false))
  }, [weekStart, weekEnd])

  const reload = () => { fetchWeekData() }

  const { startMin, endMin } = useMemo(() => {
    const openDays = (schedule ?? []).filter((d) => !d.is_closed && d.open_time && d.close_time)
    if (openDays.length === 0) return { startMin: DEFAULT_START, endMin: DEFAULT_END }
    const opens = openDays.map((d) => toMinutes(d.open_time))
    const closes = openDays.map((d) => toMinutes(d.close_time))
    return { startMin: Math.min(...opens), endMin: Math.max(...closes) }
  }, [schedule])

  const slotCount = Math.max(1, Math.round((endMin - startMin) / SLOT_MINUTES))

  const { grid, serviceBlocksByCell } = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(slotCount).fill(null))

    for (let day = 0; day < 7; day++) {
      const wh = (schedule ?? []).find((d) => d.day_of_week === day)
      for (let s = 0; s < slotCount; s++) {
        const slotStart = startMin + s * SLOT_MINUTES
        const isOpen = wh && !wh.is_closed && slotStart >= toMinutes(wh.open_time) && slotStart < toMinutes(wh.close_time)
        g[day][s] = { type: isOpen ? 'free' : 'closed' }
      }
    }

    appointments.forEach((a) => {
      if (a.status === 'cancelled') return
      const dt = new Date(a.scheduled_at.replace(' ', 'T'))
      const dayIdx = weekDays.findIndex((d) => isoDate(d) === isoDate(dt))
      if (dayIdx === -1) return

      const duration = a.service?.duration_minutes ?? a.duration_minutes ?? 30
      const apptStartMin = dt.getHours() * 60 + dt.getMinutes()
      let firstSlot = Math.floor((apptStartMin - startMin) / SLOT_MINUTES)
      let span = Math.ceil(duration / SLOT_MINUTES)

      if (firstSlot < 0) { span += firstSlot; firstSlot = 0 }
      if (firstSlot >= slotCount || span <= 0) return
      span = Math.min(span, slotCount - firstSlot)

      g[dayIdx][firstSlot] = { type: 'booked', appointment: a, rowSpan: span }
      for (let k = 1; k < span; k++) g[dayIdx][firstSlot + k] = { type: 'consumed' }
    })

    const serviceBlocksByCell = Array.from({ length: 7 }, () => Array.from({ length: slotCount }, () => []))

    blocks.forEach((b) => {
      const dt = new Date(b.starts_at.replace(' ', 'T'))
      const dayIdx = weekDays.findIndex((d) => isoDate(d) === isoDate(dt))
      if (dayIdx === -1) return

      const duration = b.duration_minutes
      const blockStartMin = dt.getHours() * 60 + dt.getMinutes()
      let firstSlot = Math.floor((blockStartMin - startMin) / SLOT_MINUTES)
      let span = Math.ceil(duration / SLOT_MINUTES)

      if (firstSlot < 0) { span += firstSlot; firstSlot = 0 }
      if (firstSlot >= slotCount || span <= 0) return
      span = Math.min(span, slotCount - firstSlot)

      // A service-specific block doesn't take over the cell (the salon is still
      // bookable for other services then) — it's overlaid as a badge instead.
      if (b.salon_service_id) {
        for (let k = 0; k < span; k++) {
          const slot = firstSlot + k
          if (slot < slotCount) serviceBlocksByCell[dayIdx][slot].push(b)
        }
        return
      }

      // An appointment already occupying this cell takes priority (shouldn't normally happen).
      if (g[dayIdx][firstSlot]?.type === 'booked') return

      g[dayIdx][firstSlot] = { type: 'blocked', block: b, rowSpan: span }
      for (let k = 1; k < span; k++) g[dayIdx][firstSlot + k] = { type: 'consumed' }
    })

    return { grid: g, serviceBlocksByCell }
  }, [schedule, appointments, blocks, weekDays, startMin, slotCount])

  const slotDateTime = (dayIdx, slotIdx) => {
    const totalMin = startMin + slotIdx * SLOT_MINUTES
    const d = weekDays[dayIdx]
    return `${isoDate(d)}T${fromMinutes(totalMin)}`
  }

  const openChoice = (dayIdx, slotIdx) => {
    setModal({ type: 'choice', defaultScheduledAt: slotDateTime(dayIdx, slotIdx) })
  }

  const removeBlock = async (block) => {
    await api.delete(`/salon/schedule-blocks/${block.id}`)
    setModal(null)
    reload()
  }

  const today = isoDate(new Date())
  const rangeLabel = `${weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-prima-dark">{t('workingHours.grid.title')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 font-medium min-w-[10rem] text-center">{rangeLabel}</span>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-prima-orange hover:underline ms-1">
              {t('workingHours.grid.thisWeek')}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 border-b border-gray-100">
        <Legend color="bg-orange-100" label={t('workingHours.grid.legendBooked')} />
        <Legend color="bg-green-50 border border-green-200" label={t('workingHours.grid.legendFree')} />
        <Legend color="bg-slate-100" label={t('workingHours.grid.legendClosed')} />
      </div>

      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-sm border-collapse min-w-[760px]">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="bg-slate-50 px-2 py-2 w-16 sticky start-0 z-20"></th>
              {weekDays.map((d, i) => (
                <th
                  key={i}
                  className={`px-2 py-2 text-xs font-semibold ${isoDate(d) === today ? 'bg-orange-50 text-prima-orange' : 'bg-slate-50 text-prima-dark'}`}
                >
                  {t(`days.${d.getDay()}`)}
                  <div className="font-normal text-gray-400">{d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: slotCount }, (_, s) => (
              <tr key={s}>
                <td className="bg-slate-50 px-2 py-1 text-xs text-gray-400 text-center sticky start-0" dir="ltr">
                  {fromMinutes(startMin + s * SLOT_MINUTES)}
                </td>
                {weekDays.map((d, day) => {
                  const cell = grid[day][s]
                  if (!cell || cell.type === 'consumed') return null

                  if (cell.type === 'booked') {
                    const a = cell.appointment
                    return (
                      <td
                        key={day}
                        rowSpan={cell.rowSpan}
                        onClick={() => setModal({ type: 'detail', appointment: a })}
                        className="border border-white bg-orange-100 hover:bg-orange-200 cursor-pointer align-top px-2 py-1 text-xs text-orange-800 font-medium transition-colors"
                      >
                        <p className="truncate">{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</p>
                        <p className="truncate font-normal text-orange-600">{a.service?.name ?? t('appointments.other')}</p>
                      </td>
                    )
                  }

                  if (cell.type === 'free') {
                    const restricted = serviceBlocksByCell[day][s]
                    return (
                      <td
                        key={day}
                        onClick={() => openChoice(day, s)}
                        className="relative border border-white bg-green-50 hover:bg-green-100 cursor-pointer transition-colors"
                        style={{ height: 34 }}
                      >
                        {restricted.length > 0 && (
                          <span
                            onClick={(e) => { e.stopPropagation(); setModal({ type: 'serviceBlockDetail', blocks: restricted }) }}
                            title={t('workingHours.grid.serviceRestrictedTooltip')}
                            className="absolute top-0.5 end-0.5 w-2 h-2 rounded-full bg-amber-500 hover:scale-125 transition-transform"
                          />
                        )}
                      </td>
                    )
                  }

                  if (cell.type === 'blocked') {
                    return (
                      <td
                        key={day}
                        rowSpan={cell.rowSpan}
                        onClick={() => setModal({ type: 'blockDetail', block: cell.block })}
                        className="border border-white bg-slate-100 hover:bg-slate-200 cursor-pointer align-top px-2 py-1 text-xs text-slate-500 font-medium transition-colors"
                      >
                        {cell.block.note && <p className="truncate">{cell.block.note}</p>}
                      </td>
                    )
                  }

                  return <td key={day} className="border border-white bg-slate-100" style={{ height: 34 }} />
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p className="text-xs text-gray-400 px-4 sm:px-6 py-2">{t('common.loading')}</p>}

      {modal?.type === 'choice' && (
        <Modal onClose={() => setModal(null)}>
          <WalkInOrBlockChoice
            onPickWalkIn={() => setModal({ type: 'walkin', defaultScheduledAt: modal.defaultScheduledAt })}
            onPickBlock={() => setModal({ type: 'block', defaultScheduledAt: modal.defaultScheduledAt })}
          />
        </Modal>
      )}

      {modal?.type === 'walkin' && (
        <Modal onClose={() => setModal(null)}>
          <WalkInForm
            defaultScheduledAt={modal.defaultScheduledAt}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); reload() }}
          />
        </Modal>
      )}

      {modal?.type === 'block' && (
        <Modal onClose={() => setModal(null)}>
          <BlockForm
            defaultScheduledAt={modal.defaultScheduledAt}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); reload() }}
          />
        </Modal>
      )}

      {modal?.type === 'detail' && (
        <Modal onClose={() => setModal(null)}>
          <AppointmentDetail appointment={modal.appointment} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === 'blockDetail' && (
        <Modal onClose={() => setModal(null)}>
          <BlockDetail block={modal.block} onRemove={() => removeBlock(modal.block)} />
        </Modal>
      )}

      {modal?.type === 'serviceBlockDetail' && (
        <Modal onClose={() => setModal(null)}>
          <ServiceRestrictionsDetail blocks={modal.blocks} onRemove={removeBlock} />
        </Modal>
      )}
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${color}`} />
      {label}
    </div>
  )
}

function StatusBadge({ status }) {
  const { t } = useTranslation()
  const map = {
    pending: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{t('status.' + status)}</span>
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-gray-50 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-prima-dark font-medium">{value}</span>
    </div>
  )
}

function AppointmentDetail({ appointment: a }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const duration = a.service?.duration_minutes ?? a.duration_minutes ?? 30

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-prima-dark">{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</h2>
        <StatusBadge status={a.status} />
      </div>
      <div className="space-y-0.5">
        <DetailRow label={t('common.service')} value={a.service?.name ?? t('appointments.other')} />
        <DetailRow label={t('appointments.scheduledAt')} value={new Date(a.scheduled_at.replace(' ', 'T')).toLocaleString()} />
        <DetailRow label={t('appointments.duration')} value={formatDuration(duration)} />
        <DetailRow label={t('common.price')} value={`$${a.price_at_booking}`} />
        {a.client_phone && <DetailRow label={t('appointments.clientPhone')} value={a.client_phone} />}
        {a.notes && <DetailRow label={t('common.notes')} value={a.notes} />}
      </div>
      <button
        onClick={() => navigate('/appointments?status=' + a.status)}
        className="mt-4 px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg font-medium shadow-sm transition-colors"
      >
        {t('workingHours.grid.goToAppointments')}
      </button>
    </div>
  )
}

function BlockDetail({ block, onRemove }) {
  const { t } = useTranslation()
  const start = new Date(block.starts_at.replace(' ', 'T'))

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-semibold text-prima-dark mb-3">{t('workingHours.grid.blockedTitle')}</h2>
      <div className="space-y-0.5">
        <DetailRow label={t('appointments.scheduledAt')} value={start.toLocaleString()} />
        <DetailRow label={t('appointments.duration')} value={formatDuration(block.duration_minutes)} />
        {block.note && <DetailRow label={t('common.notes')} value={block.note} />}
      </div>
      <button
        onClick={onRemove}
        className="mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded-lg font-medium transition-colors"
      >
        {t('workingHours.grid.removeBlock')}
      </button>
    </div>
  )
}

function ServiceRestrictionsDetail({ blocks, onRemove }) {
  const { t } = useTranslation()

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-semibold text-prima-dark mb-3">{t('workingHours.grid.serviceRestrictedTitle')}</h2>
      <div className="space-y-3">
        {blocks.map((b) => {
          const start = new Date(b.starts_at.replace(' ', 'T'))
          return (
            <div key={b.id} className="border border-gray-100 rounded-lg p-3">
              <div className="space-y-0.5">
                <DetailRow label={t('common.service')} value={b.service?.name ?? '—'} />
                <DetailRow label={t('appointments.scheduledAt')} value={start.toLocaleString()} />
                <DetailRow label={t('appointments.duration')} value={formatDuration(b.duration_minutes)} />
                {b.note && <DetailRow label={t('common.notes')} value={b.note} />}
              </div>
              <button
                onClick={() => onRemove(b)}
                className="mt-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs rounded-lg font-medium transition-colors"
              >
                {t('workingHours.grid.removeBlock')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
