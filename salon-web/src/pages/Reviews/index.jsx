import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Reviews() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/salon/reviews').then(({ data }) => setData(data))
  }, [])

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-prima-dark">{t('reviews.title')}</h1>

        {data && (
          <div className="flex gap-6 bg-white border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm w-full sm:w-fit">
            <div className="text-center">
              <p className="text-4xl font-bold text-prima-orange">
                {data.average_rating ?? '—'}
              </p>
              <p className="text-prima-orange text-lg mt-1">{data.average_rating ? stars(Math.round(data.average_rating)) : '—'}</p>
              <p className="text-xs text-gray-400 mt-1">{t('reviews.averageRating')}</p>
            </div>
            <div className="border-s border-gray-100 ps-6 flex items-center">
              <div>
                <p className="text-3xl font-bold text-prima-dark">{data.reviews_count ?? 0}</p>
                <p className="text-xs text-gray-400">{t('reviews.totalReviews')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {data?.reviews?.data?.length === 0 && <p className="text-gray-400">{t('reviews.empty')}</p>}
          {(data?.reviews?.data ?? []).map((r) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-prima-dark">{r.client?.name ?? t('common.client')}</span>
                <span className="text-prima-orange">{stars(r.rating)}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
