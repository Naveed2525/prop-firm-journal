import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountCard from './AccountCard';
import AddAccountModal from './AddAccountModal';
import { exportAllToCsv } from '../utils/exportCsv';

export default function Dashboard({ accounts, onAddAccount, isDark, onToggleTheme }) {
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          {/* Title */}
          <div>
            <h1 className="text-xl font-bold tracking-tight">Futures Journal</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {accounts.length === 0
                ? 'No accounts'
                : `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Right-side controls */}
          <div className="flex items-center gap-2">
            {/* Export CSV */}
            <button
              onClick={() => exportAllToCsv(accounts)}
              title="Export all trades to CSV"
              disabled={accounts.length === 0}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
            >
              {/* Download icon */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Light / Dark toggle */}
            <button
              onClick={onToggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? (
                /* Sun icon — shown in dark mode to switch to light */
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="5" />
                  <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                /* Moon icon — shown in light mode to switch to dark */
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
        {accounts.length === 0 ? (
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
          accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onClick={() => navigate(`/account/${acc.id}`)}
            />
          ))
        )}
      </div>

      {showAdd && (
        <AddAccountModal
          onSave={(data) => { onAddAccount(data); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
