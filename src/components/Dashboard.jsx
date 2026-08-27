import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountCard from './AccountCard';
import AddAccountModal from './AddAccountModal';
import ManageFirms from './ManageFirms';
import ExpensesDashboard from './ExpensesDashboard';
import { exportAllToCsv } from '../utils/exportCsv';
import { useAccountsPnL } from '../hooks/useData';
import { useFirms } from '../context/FirmsContext';
import { useSortPreference, SORT_FIELDS } from '../hooks/useSortPreference';
import { useFilterPreference } from '../hooks/useFilterPreference';
import { categorizeAccounts, matchesSearch, matchesAccountType, matchesFirmFilter, sortAccounts, sortDirectionLabel, ACCOUNT_TYPES } from '../utils/accountFilters';

export default function Dashboard({ accounts, loading, onAddAccount, isDark, onToggleTheme }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showManageFirms, setShowManageFirms] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showBlown, setShowBlown] = useState(false);
  const [showPassed, setShowPassed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { sortField, sortDirection, setSortField, toggleSortDirection } = useSortPreference();
  const {
    accountTypeFilters, firmFilters,
    toggleAccountType, toggleFirm,
    clearAccountTypes, clearFirms, resetFilters,
  } = useFilterPreference();
  // Collapsed by default to save space (esp. on iPhone); auto-expanded on
  // mount if filters were already selected in a previous session.
  const [showFilterPanel, setShowFilterPanel] = useState(
    () => accountTypeFilters.length > 0 || firmFilters.length > 0
  );
  const navigate = useNavigate();
  const { firms } = useFirms();
  const pnlMap = useAccountsPnL(accounts.map((a) => a.id));

  const handleExport = async () => {
    setExporting(true);
    try { await exportAllToCsv(accounts); } finally { setExporting(false); }
  };

  const { evalAccounts, passedEvalAccounts, fundedAccounts, blownEval, blownFunded } = categorizeAccounts(accounts);
  const blownAccounts = blownEval.concat(blownFunded);

  const activeFilterCount = accountTypeFilters.length + firmFilters.length;
  const isFiltering = searchQuery.trim() !== '' || activeFilterCount > 0;

  const applyFilters = (list) =>
    sortAccounts(
      list.filter((acc) =>
        matchesAccountType(acc, accountTypeFilters) &&
        matchesFirmFilter(acc, firmFilters) &&
        matchesSearch(acc, firms[acc.firm], searchQuery)
      ),
      sortField,
      sortDirection,
      pnlMap,
      firms
    );

  const filteredEval        = applyFilters(evalAccounts);
  const filteredPassed      = applyFilters(passedEvalAccounts);
  const filteredFunded      = applyFilters(fundedAccounts);
  const filteredBlownEval   = applyFilters(blownEval);
  const filteredBlownFunded = applyFilters(blownFunded);
  const totalMatched = filteredEval.length + filteredPassed.length + filteredFunded.length
    + filteredBlownEval.length + filteredBlownFunded.length;

  // Unfiltered but still sorted — used by the collapsed Passed/Blown sections
  // so the chosen sort applies there too, not just while searching/filtering.
  const sortedPassedEvalAccounts = sortAccounts(passedEvalAccounts, sortField, sortDirection, pnlMap, firms);
  const sortedBlownEval          = sortAccounts(blownEval, sortField, sortDirection, pnlMap, firms);
  const sortedBlownFunded        = sortAccounts(blownFunded, sortField, sortDirection, pnlMap, firms);

  // Every configured firm (builtin + custom), not just ones with an account
  // already open, so you can pre-filter for a firm before adding to it.
  const firmOptions = Object.entries(firms)
    .map(([key, f]) => ({ key, name: f?.name ?? key }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const headerSummary = (() => {
    if (accounts.length === 0) return 'No accounts';
    const parts = [];
    parts.push(`${evalAccounts.length} Eval`);
    if (passedEvalAccounts.length > 0) parts.push(`${passedEvalAccounts.length} Eval Passed`);
    parts.push(`${fundedAccounts.length} Funded`);
    if (blownFunded.length > 0) parts.push(`${blownFunded.length} Funded Blown`);
    if (blownEval.length > 0) parts.push(`${blownEval.length} Eval Blown`);
    return parts.join(' · ');
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Futures Journal</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">{headerSummary}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Trading Plan */}
            <button
              onClick={() => navigate('/trading-plan')}
              title="Trading plan"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </button>

            {/* Manage Firms */}
            <button
              onClick={() => setShowManageFirms(true)}
              title="Manage prop firms"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExport}
              title="Export all trades to CSV"
              disabled={accounts.length === 0 || exporting}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
            >
              {exporting ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </button>

            {/* Light / Dark toggle */}
            <button
              onClick={onToggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="5" />
                  <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Add account */}
            <button
              onClick={() => setShowAdd(true)}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Search + filter + sort */}
        {!loading && accounts.length > 0 && (
          <div className="pb-3 space-y-2">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by firm, label, or size…"
                className="input pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-stretch gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="input text-sm flex-1 min-w-0"
                aria-label="Sort by"
              >
                {SORT_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={toggleSortDirection}
                title={sortDirectionLabel(sortField, sortDirection)}
                aria-label={sortDirectionLabel(sortField, sortDirection)}
                className="shrink-0 w-11 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {sortDirection === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Filters toggle — collapsible so it doesn't eat vertical space on a phone screen */}
            <button
              type="button"
              onClick={() => setShowFilterPanel((v) => !v)}
              aria-expanded={showFilterPanel}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6 9.75h12M10 15h4" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFilterPanel && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-3">
                <FilterChipGroup
                  title="Account Type"
                  allLabel="All"
                  options={ACCOUNT_TYPES}
                  selected={accountTypeFilters}
                  onToggle={toggleAccountType}
                  onClear={clearAccountTypes}
                  chipClass={ACCOUNT_TYPE_CHIP_CLASS}
                />
                <FilterChipGroup
                  title="Firm"
                  allLabel="All firms"
                  options={firmOptions.map((f) => ({ value: f.key, label: f.name }))}
                  selected={firmFilters}
                  onToggle={toggleFirm}
                  onClear={clearFirms}
                  colorFor={(opt) => firms[opt.value]?.color}
                />
              </div>
            )}

            {isFiltering && (
              <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {totalMatched} {totalMatched === 1 ? 'account' : 'accounts'} found
                </p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span className="bg-blue-100 dark:bg-blue-950 rounded-full px-2 py-0.5">
                      {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
                    </span>
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account list */}
      <div className="px-4 py-4 space-y-3 pb-safe">
        {loading ? (
          [0, 1].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))
        ) : accounts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No accounts yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-8">
              Add a prop firm account to start tracking
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 py-4 font-semibold transition-colors"
            >
              Add First Account
            </button>
          </div>
        ) : isFiltering && totalMatched === 0 ? (
          <NoResults />
        ) : (
          <>
            {/* Evaluation Accounts */}
            <SectionLabel title="Evaluation Accounts" count={filteredEval.length} />
            {filteredEval.length === 0 ? (
              <EmptySection msg={isFiltering ? 'No matching evaluation accounts' : 'No evaluation accounts'} />
            ) : (
              filteredEval.map((acc) => (
                <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
              ))
            )}

            {/* Funded Accounts */}
            <SectionLabel title="Funded Accounts" count={filteredFunded.length} className="pt-3" />
            {filteredFunded.length === 0 ? (
              <EmptySection msg={isFiltering ? 'No matching funded accounts' : 'No funded accounts'} />
            ) : (
              filteredFunded.map((acc) => (
                <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
              ))
            )}

            {/* Passed Eval */}
            {isFiltering ? (
              filteredPassed.length > 0 && (
                <div className="pt-4 space-y-3">
                  <SectionLabel title="Passed Eval Accounts" count={filteredPassed.length} />
                  {filteredPassed.map((acc) => (
                    <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
                  ))}
                </div>
              )
            ) : passedEvalAccounts.length > 0 && (
              <div className="pt-4">
                <button
                  onClick={() => setShowPassed((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  {showPassed ? 'Hide' : 'Show'} Passed Eval ({passedEvalAccounts.length})
                </button>

                {showPassed && (
                  <div className="mt-3 space-y-3 opacity-60">
                    <SectionLabel title="Passed Eval Accounts" count={passedEvalAccounts.length} className="pt-1" />
                    {sortedPassedEvalAccounts.map((acc) => (
                      <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expenses Dashboard */}
            <div className="pt-3">
              <ExpensesDashboard accounts={accounts} />
            </div>

            {/* Blown Accounts */}
            {isFiltering ? (
              (filteredBlownEval.length > 0 || filteredBlownFunded.length > 0) && (
                <div className="pt-4 space-y-3">
                  {filteredBlownEval.length > 0 && (
                    <>
                      <SectionLabel title="Blown Eval" count={filteredBlownEval.length} />
                      {filteredBlownEval.map((acc) => (
                        <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
                      ))}
                    </>
                  )}
                  {filteredBlownFunded.length > 0 && (
                    <>
                      <SectionLabel title="Blown Funded" count={filteredBlownFunded.length} className="pt-1" />
                      {filteredBlownFunded.map((acc) => (
                        <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
                      ))}
                    </>
                  )}
                </div>
              )
            ) : blownAccounts.length > 0 && (
              <div className="pt-4">
                <button
                  onClick={() => setShowBlown((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showBlown
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    }
                  </svg>
                  {showBlown ? 'Hide' : 'Show'} Blown Accounts ({blownAccounts.length})
                </button>

                {showBlown && (
                  <div className="mt-3 space-y-3">
                    {blownEval.length > 0 && (
                      <>
                        <SectionLabel title="Blown Eval" count={blownEval.length} className="pt-1" />
                        {sortedBlownEval.map((acc) => (
                          <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
                        ))}
                      </>
                    )}
                    {blownFunded.length > 0 && (
                      <>
                        <SectionLabel title="Blown Funded" count={blownFunded.length} className="pt-1" />
                        {sortedBlownFunded.map((acc) => (
                          <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddAccountModal
          onSave={async (data) => { await onAddAccount(data); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showManageFirms && (
        <ManageFirms onClose={() => setShowManageFirms(false)} />
      )}
    </div>
  );
}

// Tailwind classes for each account-type chip's active state, echoing the
// accent colors already used for these states elsewhere (AccountDetail's
// status badge, the Passed/Blown section toggles).
const ACCOUNT_TYPE_CHIP_CLASS = {
  eval: 'bg-blue-600 border-blue-600',
  funded: 'bg-green-600 border-green-600',
  passed: 'bg-emerald-600 border-emerald-600',
  'blown-eval': 'bg-red-600 border-red-600',
  'blown-funded': 'bg-red-700 border-red-700',
};

function FilterChipGroup({ title, allLabel, options, selected, onToggle, onClear, chipClass, colorFor }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={selected.length === 0} onClick={onClear} activeClassName="bg-gray-700 border-gray-700 dark:bg-gray-600 dark:border-gray-600">
          {allLabel}
        </FilterChip>
        {options.map((opt) => (
          <FilterChip
            key={opt.value}
            active={selected.includes(opt.value)}
            onClick={() => onToggle(opt.value)}
            activeClassName={chipClass?.[opt.value]}
            activeColor={colorFor?.(opt)}
          >
            {opt.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

// A toggle-able pill. `activeColor` (a firm's own hex color) takes priority
// over `activeClassName` (a static Tailwind color) when both are given —
// used for firm chips, which don't have a fixed palette to pick classes from.
function FilterChip({ active, onClick, children, activeClassName = 'bg-blue-600 border-blue-600', activeColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active && activeColor ? { backgroundColor: activeColor, borderColor: activeColor } : undefined}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? `text-white border-transparent ${activeColor ? '' : activeClassName}`
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function SectionLabel({ title, count, className = '', muted = false }) {
  return (
    <div className={`flex items-center gap-2 pb-1 ${className}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${muted ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`}>
        {title}
      </p>
      <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">{count}</span>
    </div>
  );
}

function EmptySection({ msg }) {
  return (
    <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-5 text-center">
      <p className="text-sm text-gray-400 dark:text-gray-500">{msg}</p>
    </div>
  );
}

function NoResults() {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">🔍</div>
      <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No accounts found</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term or filter</p>
    </div>
  );
}

