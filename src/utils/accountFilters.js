// Pure account categorization / search / sort helpers used by Dashboard.jsx.
// Split out into their own module so they can be unit tested without
// rendering React and without a live backend.

// Case/whitespace-tolerant "is this eval marked passed?" check. Account
// status is only ever written as the literal string 'passed' by this app's
// own UI, but data can also arrive via direct API calls, manual recreation
// after a data-loss incident, etc. — so don't silently misfile an account
// into the wrong section over a casing mismatch.
export function isPassed(account) {
  return String(account?.status ?? '').trim().toLowerCase() === 'passed';
}

export function isFunded(account) {
  return String(account?.phase ?? '').trim().toLowerCase() === 'funded';
}

export function isBlown(account) {
  return account?.blown === true;
}

// The five mutually-exclusive account types the dashboard filters by.
// Every account maps to exactly one of these.
export const ACCOUNT_TYPES = [
  { value: 'eval', label: 'Eval (active)' },
  { value: 'funded', label: 'Funded (active)' },
  { value: 'passed', label: 'Passed Eval' },
  { value: 'blown-eval', label: 'Blown Eval' },
  { value: 'blown-funded', label: 'Blown Funded' },
];
const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES.map((t) => t.value);
const TYPE_TO_BUCKET = {
  eval: 'evalAccounts',
  passed: 'passedEvalAccounts',
  funded: 'fundedAccounts',
  'blown-eval': 'blownEval',
  'blown-funded': 'blownFunded',
};

export function getAccountType(account) {
  if (isBlown(account)) return isFunded(account) ? 'blown-funded' : 'blown-eval';
  if (isFunded(account)) return 'funded';
  return isPassed(account) ? 'passed' : 'eval';
}

export function isValidAccountType(value) {
  return ACCOUNT_TYPE_VALUES.includes(value);
}

// Split the full account list into the buckets the dashboard renders.
// An account appears in exactly one of these five buckets.
export function categorizeAccounts(accounts) {
  const buckets = { evalAccounts: [], passedEvalAccounts: [], fundedAccounts: [], blownEval: [], blownFunded: [] };
  for (const account of accounts) {
    buckets[TYPE_TO_BUCKET[getAccountType(account)]].push(account);
  }
  return buckets;
}

// Empty selection means "All" (no restriction) for both filters below —
// that's the default state and what the "All" / "All firms" chip clears to.
export function matchesAccountType(account, selectedTypes) {
  return !selectedTypes || selectedTypes.length === 0 || selectedTypes.includes(getAccountType(account));
}

export function matchesFirmFilter(account, selectedFirms) {
  return !selectedFirms || selectedFirms.length === 0 || selectedFirms.includes(account.firm);
}

export function matchesSearch(account, firm, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const firmName = (firm?.name ?? '').toLowerCase();
  const label = (account.label ?? '').toLowerCase();
  const sizeRaw = String(account.size ?? '');
  const sizeK = `${(Number(account.size) || 0) / 1000}k`;
  return firmName.includes(q) || label.includes(q) || sizeRaw.includes(q) || sizeK.includes(q);
}

// The date that represents "when this account happened" for sorting
// purposes: prefer the actual purchase date (only set on eval accounts),
// fall back to when the record was created (funded accounts, or eval
// accounts added without a purchase date on file).
function accountTimestamp(account) {
  const raw = account?.purchaseDateTime || account?.createdAt;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

// All comparators return in ascending order; sortAccounts flips the sign
// for descending. Keeping every case ascending-by-default here is what
// makes the direction toggle behave uniformly across every sort field.
export function compareAccounts(a, b, sortField, pnlMap, firms) {
  switch (sortField) {
    case 'pnl':
      return (pnlMap[a.id] ?? 0) - (pnlMap[b.id] ?? 0);
    case 'firm':
      return (firms[a.firm]?.name ?? a.firm ?? '').localeCompare(firms[b.firm]?.name ?? b.firm ?? '');
    case 'size':
      return (Number(a.size) || 0) - (Number(b.size) || 0);
    case 'date':
    default:
      return accountTimestamp(a) - accountTimestamp(b);
  }
}

export function sortAccounts(list, sortField, sortDirection, pnlMap, firms) {
  const dir = sortDirection === 'asc' ? 1 : -1;
  // Decorate-sort-undecorate: pre-compute each item's sort key once instead
  // of recomputing it (and re-running localeCompare/Number coercion) on
  // every comparison, and use it as a stable tiebreaker by original index
  // so equal keys never get reshuffled by a direction toggle.
  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const primary = dir * compareAccounts(a.item, b.item, sortField, pnlMap, firms);
      return primary !== 0 ? primary : a.index - b.index;
    })
    .map(({ item }) => item);
}

export function sortDirectionLabel(sortField, sortDirection) {
  const asc = sortDirection === 'asc';
  switch (sortField) {
    case 'pnl':
      return asc ? 'Lowest P&L first' : 'Highest P&L first';
    case 'firm':
      return asc ? 'Firm A to Z' : 'Firm Z to A';
    case 'size':
      return asc ? 'Smallest account first' : 'Largest account first';
    case 'date':
    default:
      return asc ? 'Oldest first' : 'Newest first';
  }
}
