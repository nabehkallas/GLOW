import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

const defaultSchedule = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_closed: i === 0 || i === 6,
  open_time: '09:00',
  close_time: '18:00',
}))

export default function WorkingHours() {
  const { t } = useTranslation()
  const [schedule, setSchedule] = useState(defaultSchedule)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/salon/working-hours').then(({ data }) => {
      if (data.length > 0) {
        const merged = defaultSchedule.map((d) => data.find((r) => r.day_of_week === d.day_of_week) ?? d)
        setSchedule(merged)
      }
    })
  }, [])

  const update = (idx, field, value) => {
    setSchedule((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  const save = async () => {
    setSaving(true); setMessage('')
    try {
      await api.post('/salon/working-hours', { schedule })
      setMessage(t('workingHours.savedOk'))
    } catch {
      setMessage(t('workingHours.saveFailed'))
    } finally { setSaving(false) }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-prima-dark">{t('workingHours.title')}</h1>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {schedule.map((day, i) => (
            <div key={i} className="px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between sm:justify-start sm:gap-6 mb-2 sm:mb-0">
                <span className="w-28 text-sm font-semibold text-prima-dark">{t(`days.${day.day_of_week}`)}</span>
                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.is_closed}
                    onChange={(e) => update(i, 'is_closed', e.target.checked)}
                    className="rounded accent-prima-green"
                  />
                  {t('workingHours.closed')}
                </label>
              </div>

              {!day.is_closed && (
                <div className="flex items-center gap-3 mt-2 sm:mt-0 sm:inline-flex sm:ms-6" dir="ltr">
                  <input
                    type="time"
                    value={day.open_time}
                    onChange={(e) => update(i, 'open_time', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="text-gray-400 text-sm shrink-0">{t('workingHours.to')}</span>
                  <input
                    type="time"
                    value={day.close_time}
                    onChange={(e) => update(i, 'close_time', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors"
          >
            {saving ? t('common.saving') : t('workingHours.saveSchedule')}
          </button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      </div>
    </Layout>
  )
}
