import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { loading, salon } = useAuth()
  const { t } = useTranslation()

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      {t('common.loading')}
    </div>
  )

  if (salon?.status === 'pending') return (
    <div className="flex flex-col items-center justify-center h-screen text-center gap-3 px-4">
      <h2 className="text-xl font-semibold text-yellow-600">{t('protected.awaitingTitle')}</h2>
      <p className="text-gray-500 max-w-sm">{t('protected.awaitingMessage')}</p>
    </div>
  )

  if (salon?.status === 'rejected') return (
    <div className="flex flex-col items-center justify-center h-screen text-center gap-3 px-4">
      <h2 className="text-xl font-semibold text-red-600">{t('protected.rejectedTitle')}</h2>
      <p className="text-gray-500 max-w-sm">
        {salon.rejection_reason ?? t('protected.contactSupport')}
      </p>
    </div>
  )

  return children
}
