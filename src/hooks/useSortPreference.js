import { useState, useEffect } from 'react';

const KEY = 'pfj:sort';

export const SORT_FIELDS = [
  { value: 'date', label: 'Date' },
  { value: 'pnl', label: 'P&L' },
  { value: 'firm', label: 'Firm Name' },
  { value: 'size', label: 'Account Size' },
];

const DEFAULT = { field: 'date', direction: 'desc' };

function loadPreference() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    const field = SORT_FIELDS.some((f) => f.value === parsed.field) ? parsed.field : DEFAULT.field;
    const direction = parsed.direction === 'asc' || parsed.direction === 'desc' ? parsed.direction : DEFAULT.direction;
    return { field, direction };
  } catch {
    return DEFAULT;
  }
}

// Sort field + direction, shared across every account section (Eval, Funded,
// Passed, Blown) and persisted across navigation / reloads.
export function useSortPreference() {
  const [{ field, direction }, setPreference] = useState(loadPreference);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ field, direction }));
  }, [field, direction]);

  return {
    sortField: field,
    sortDirection: direction,
    setSortField: (nextField) => setPreference((prev) => ({ ...prev, field: nextField })),
    setSortDirection: (nextDirection) => setPreference((prev) => ({ ...prev, direction: nextDirection })),
    toggleSortDirection: () =>
      setPreference((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' })),
  };
}
