import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

// Per-context recent search terms for the current client user — fetched from
// /client/search-history, logged there on blur (not on every keystroke, to
// avoid flooding the log with partial fragments).
export default function useRecentSearches(context) {
  const [terms, setTerms] = useState([]);

  const load = useCallback(() => {
    api
      .get('/client/search-history', { params: { context } })
      .then(({ data }) => setTerms(data.data ?? []))
      .catch(() => {});
  }, [context]);

  useEffect(() => {
    load();
  }, [load]);

  const logSearch = useCallback(
    (term) => {
      const trimmed = (term ?? '').trim();
      if (!trimmed) return;
      api
        .post('/client/search-history', { context, term: trimmed })
        .then(load)
        .catch(() => {});
    },
    [context, load]
  );

  return { terms, logSearch };
}
