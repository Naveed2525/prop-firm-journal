import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAccounts } from './hooks/useData';
import Dashboard from './components/Dashboard';
import AccountDetail from './components/AccountDetail';

export default function App() {
  const { accounts, addAccount, deleteAccount } = useAccounts();

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
