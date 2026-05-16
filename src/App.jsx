import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAccounts } from './hooks/useData';
import { useTheme } from './hooks/useTheme';
import Dashboard from './components/Dashboard';
import AccountDetail from './components/AccountDetail';

export default function App() {
  const { accounts, loading, addAccount, updateAccount, deleteAccount } = useAccounts();
  const { isDark, toggle } = useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              accounts={accounts}
              loading={loading}
              onAddAccount={addAccount}
              isDark={isDark}
              onToggleTheme={toggle}
            />
          }
        />
        <Route
          path="/account/:id"
          element={<AccountDetail accounts={accounts} onDeleteAccount={deleteAccount} onUpdateAccount={updateAccount} onAddAccount={addAccount} />}
        />
      </Routes>
    </BrowserRouter>
  );
}
