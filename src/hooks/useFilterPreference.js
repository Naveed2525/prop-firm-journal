import { useState, useEffect } from 'react';
import { isValidAccountType } from '../utils/accountFilters';

const KEY = 'pfj:filters';
const DEFAULT = { accountTypes: [], firms: [] };

function loadPreference() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    const accountTypes = Array.isArray(parsed.accountTypes)
      ? parsed.accountTypes.filter(isValidAccountType)
      : [];
    const firms = Array.isArray(parsed.firms) ? parsed.firms.filter((f) => typeof f === 'string') : [];
    return { accountTypes, firms };
  } catch {
    return DEFAULT;
  }
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Selected account-type + firm filters for the dashboard, persisted to
// localStorage so they survive navigation and reloads (mirrors
// useSortPreference). An empty array for either means "All" — that's the
// default, and what each group's "All" chip resets to.
export function useFilterPreference() {
  const [{ accountTypes, firms }, setPreference] = useState(loadPreference);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ accountTypes, firms }));
  }, [accountTypes, firms]);

  return {
    accountTypeFilters: accountTypes,
    firmFilters: firms,
    toggleAccountType: (value) => setPreference((prev) => ({ ...prev, accountTypes: toggle(prev.accountTypes, value) })),
    toggleFirm: (key) => setPreference((prev) => ({ ...prev, firms: toggle(prev.firms, key) })),
    clearAccountTypes: () => setPreference((prev) => ({ ...prev, accountTypes: [] })),
    clearFirms: () => setPreference((prev) => ({ ...prev, firms: [] })),
    resetFilters: () => setPreference(DEFAULT),
  };
}
