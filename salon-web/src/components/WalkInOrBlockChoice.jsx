import { useTranslation } from 'react-i18next'
import { UserPlus, Ban } from 'lucide-react'

export default function WalkInOrBlockChoice({ onPickWalkIn, onPickBlock }) {
  const { t } = useTranslation()

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-semibold text-prima-dark mb-4">{t('workingHours.grid.choiceTitle')}</h2>
      <div className="space-y-3">
        <button
          onClick={onPickWalkIn}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-prima-orange hover:bg-orange-50 transition-colors text-start"
        >
          <UserPlus className="w-5 h-5 text-prima-orange shrink-0" />
          <div>
            <p className="font-medium text-prima-dark">{t('workingHours.grid.choiceWalkIn')}</p>
          </div>
        </button>
        <button
          onClick={onPickBlock}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-slate-400 hover:bg-slate-50 transition-colors text-start"
        >
          <Ban className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <p className="font-medium text-prima-dark">{t('workingHours.grid.choiceBlock')}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
