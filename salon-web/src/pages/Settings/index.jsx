import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet } from 'lucide-react'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/auth'
import api from '../../api/axios'

export default function Settings() {
  const { t } = useTranslation()
  const { salon, updateSalon } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleBalanceManagement = async () => {
    const next = !salon?.balance_management_enabled
    setSaving(true)
    setError('')
    try {
      await api.patch('salon/settings', { balance_management_enabled: next })
      updateSalon({ balance_management_enabled: next })
    } catch {
      setError(t('settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-prima-dark">{t('nav.settings')}</h1>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-prima-orange" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-prima-dark">{t('settings.balanceManagementTitle')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('settings.balanceManagementDescription')}</p>
            </div>
            <button
              onClick={toggleBalanceManagement}
              disabled={saving}
              role="switch"
              aria-checked={!!salon?.balance_management_enabled}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
                salon?.balance_management_enabled ? 'bg-prima-orange' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  salon?.balance_management_enabled ? 'translate-x-[22px] rtl:-translate-x-[22px]' : 'translate-x-0.5 rtl:-translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>
      </div>
    </Layout>
  )
}
