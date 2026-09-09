import { useTranslation } from 'react-i18next'

export default function RecentSearchChips({ terms, onSelect }) {
  const { t } = useTranslation()
  if (!terms?.length) return null

  return (
    <div>
      <p className="text-xs text-gray-400 mb-1.5">{t('common.recentSearches')}</p>
      <div className="flex flex-wrap gap-1.5">
        {terms.map((term) => (
          <button
            key={term}
            onClick={() => onSelect(term)}
            className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 text-prima-dark hover:bg-gray-50 transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  )
}
