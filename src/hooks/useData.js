import { useState } from 'react';
import { db } from '../lib/storage';

export function useAccounts() {
  const [accounts, setAccounts] = useState(() => db.getAccounts());

  const addAccount = (body) => {
    const account = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
    };
    const next = [...db.getAccounts(), account];
    db.setAccounts(next);
    setAccounts(next);
    return account;
  };

  const deleteAccount = (id) => {
    db.deleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return { accounts, loading: false, error: null, addAccount, deleteAccount };
}

export function useTrades(accountId) {
  const [trades, setTrades] = useState(() =>
    accountId ? db.getTrades(accountId) : []
  );

  const addTrade = (body) => {
    const trade = {
      id: crypto.randomUUID(),
      accountId,
      ...body,
      createdAt: new Date().toISOString(),
    };
    const next = [...db.getTrades(accountId), trade];
    db.setTrades(accountId, next);
    setTrades(next);
    return trade;
  };

  const deleteTrade = (id) => {
    const next = db.getTrades(accountId).filter((t) => t.id !== id);
    db.setTrades(accountId, next);
    setTrades(next);
  };

  return { trades, loading: false, addTrade, deleteTrade };
}
