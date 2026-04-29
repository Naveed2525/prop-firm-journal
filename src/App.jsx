import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAccounts } from './hooks/useData';
import Dashboard from './components/Dashboard';
import AccountDetail from './components/AccountDetail';

export default function App() {
  const { accounts, loading, error, addAccount, deleteAccount } = useAccounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-400">Loading journal…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-2">Connection Error</p>
          <p className="text-gray-400 text-sm mb-1">{error}</p>
          <p className="text-gray-500 text-xs">Make sure Vercel KV is configured and the app is deployed.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard accounts={accounts} onAddAccount={addAccount} />}
        />
        <Route
          path="/account/:id"
          element={<AccountDetail accounts={accounts} onDeleteAccount={deleteAccount} />}
        />
      </Routes>
    </BrowserRouter>
  );
}
