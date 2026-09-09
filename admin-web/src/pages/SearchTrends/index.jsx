import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

const DAY_OPTIONS = [7, 30, 90]

export default function SearchTrends() {
  const { t } = useTranslation()
  const [days, setDays] = useState(30)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('admin/search-history/trending', { params: { days } })
      .then(({ data }) => setRows(data.data ?? []))
      .finally(() => setLoading(false))
  }, [days])

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-prima-dark">{t('searchTrends.title')}</h1>
          <div className="flex gap-2">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  days === d
                    ? 'bg-prima-orange text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('searchTrends.lastDays', { count: d })}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500">{t('searchTrends.subtitle')}</p>

        {loading ? (
          <p className="text-gray-400">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-400">{t('searchTrends.empty')}</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-start">{t('searchTrends.term')}</th>
                  <th className="px-6 py-3 text-start">{t('searchTrends.context')}</th>
                  <th className="px-6 py-3 text-start">{t('searchTrends.count')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.context}-${r.term}-${i}`} className="border-t border-gray-100 hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-prima-dark">{r.term}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-700">
                        {t(`searchTrends.contexts.${r.context}`, { defaultValue: r.context })}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-bold text-prima-dark">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
