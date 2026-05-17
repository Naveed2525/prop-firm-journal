import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountCard from './AccountCard';
import AddAccountModal from './AddAccountModal';
import ManageFirms from './ManageFirms';
import { exportAllToCsv } from '../utils/exportCsv';

export default function Dashboard({ accounts, loading, onAddAccount, isDark, onToggleTheme }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showManageFirms, setShowManageFirms] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showBlown, setShowBlown] = useState(false);
  const [showPassed, setShowPassed] = useState(false);
  const navigate = useNavigate();

  const handleExport = async () => {
    setExporting(true);
    try { await exportAllToCsv(accounts); } finally { setExporting(false); }
  };

  const blownAccounts      = accounts.filter((a) => a.blown === true);
  const activeAccounts     = accounts.filter((a) => !a.blown);
  const evalAccounts       = activeAccounts.filter((a) => a.phase !== 'funded' && a.status !== 'passed');
  const passedEvalAccounts = activeAccounts.filter((a) => a.phase !== 'funded' && a.status === 'passed');
  const fundedAccounts     = activeAccounts.filter((a) => a.phase === 'funded');
  const blownEval          = blownAccounts.filter((a) => a.phase !== 'funded');
  const blownFunded        = blownAccounts.filter((a) => a.phase === 'funded');

  const headerSummary = (() => {
    if (accounts.length === 0) return 'No accounts';
    const parts = [];
    if (evalAccounts.length > 0) parts.push(`${evalAccounts.length} Eval`);
    if (passedEvalAccounts.length > 0) parts.push(`${passedEvalAccounts.length} Eval Passed`);
    if (fundedAccounts.length > 0) parts.push(`${fundedAccounts.length} Funded`);
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
        ) : (
          <>
            {/* Evaluation Accounts */}
            <SectionLabel title="Evaluation Accounts" count={evalAccounts.length} />
            {evalAccounts.length === 0 ? (
              <EmptySection msg="No evaluation accounts" />
            ) : (
              evalAccounts.map((acc) => (
                <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
              ))
            )}

            {/* Funded Accounts */}
            <SectionLabel title="Funded Accounts" count={fundedAccounts.length} className="pt-3" />
            {fundedAccounts.length === 0 ? (
              <EmptySection msg="No funded accounts" />
            ) : (
              fundedAccounts.map((acc) => (
                <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
              ))
            )}

            {/* Passed Eval toggle */}
            {passedEvalAccounts.length > 0 && (
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
                    {passedEvalAccounts.map((acc) => (
                      <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Blown Accounts toggle */}
            {blownAccounts.length > 0 && (
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
                        {blownEval.map((acc) => (
                          <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
                        ))}
                      </>
                    )}
                    {blownFunded.length > 0 && (
                      <>
                        <SectionLabel title="Blown Funded" count={blownFunded.length} className="pt-1" />
                        {blownFunded.map((acc) => (
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
