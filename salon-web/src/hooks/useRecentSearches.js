import { useCallback, useEffect, useState } from 'react'
import api from '../api/axios'

// Per-context recent search terms for the current salon user — fetched from
// /salon/search-history, logged there on blur (not on every keystroke, to
// avoid flooding the log with partial fragments).
export default function useRecentSearches(context) {
  const [terms, setTerms] = useState([])

  const load = useCallback(() => {
    api.get('/salon/search-history', { params: { context } })
      .then(({ data }) => setTerms(data.data ?? []))
      .catch(() => {})
  }, [context])

  useEffect(() => { load() }, [load])

  const logSearch = useCallback((term) => {
    const trimmed = (term ?? '').trim()
    if (!trimmed) return
    api.post('/salon/search-history', { context, term: trimmed }).then(load).catch(() => {})
  }, [context, load])

  return { terms, logSearch }
}
