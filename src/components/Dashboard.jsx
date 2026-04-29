import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountCard from './AccountCard';
import AddAccountModal from './AddAccountModal';

export default function Dashboard({ accounts, onAddAccount }) {
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Futures Journal</h1>
            <p className="text-xs text-gray-500">
              {accounts.length === 0
                ? 'No accounts'
                : `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Account list */}
      <div className="px-4 py-4 space-y-3 pb-safe">
        {accounts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-semibold text-gray-300">No accounts yet</p>
            <p className="text-sm text-gray-500 mt-1 mb-8">Add a prop firm account to start tracking</p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 py-4 font-semibold transition-colors"
            >
              Add First Account
            </button>
          </div>
        ) : (
          accounts.map((acc) => (
            <AccountCard key={acc.id} account={acc} onClick={() => navigate(`/account/${acc.id}`)} />
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
