import { useState, useEffect, useCallback } from 'react';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/accounts');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addAccount = async (body) => {
    const r = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const created = await r.json();
    setAccounts((prev) => [...prev, created]);
    return created;
  };

  const deleteAccount = async (id) => {
    const r = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return { accounts, loading, error, addAccount, deleteAccount, refresh: load };
}

export function useTrades(accountId) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accountId) return;
    try {
      const r = await fetch(`/api/trades?accountId=${accountId}`);
      const data = await r.json();
      setTrades(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  const addTrade = async (body) => {
    const r = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, accountId }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const created = await r.json();
    setTrades((prev) => [...prev, created]);
    return created;
  };

  const deleteTrade = async (id) => {
    const r = await fetch(`/api/trades?id=${id}&accountId=${accountId}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  return { trades, loading, addTrade, deleteTrade, refresh: load };
}
