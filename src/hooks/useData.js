import { useState, useEffect } from 'react';

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch('/api/accounts')
      .then((data) => { if (!cancelled) { setAccounts(data); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const addAccount = async (body) => {
    const account = await apiFetch('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setAccounts((prev) => [...prev, account]);
    return account;
  };

  const updateAccount = async (id, body) => {
    const updated = await apiFetch(`/api/accounts?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const deleteAccount = async (id) => {
    await apiFetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return { accounts, loading, error, addAccount, updateAccount, deleteAccount };
}

export function useAccountsPnL(accountIds) {
  const idsKey = accountIds.join(',');
  const [pnlMap, setPnlMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    if (!idsKey) { setPnlMap({}); return; }
    const ids = idsKey.split(',');
    Promise.all(
      ids.map((id) =>
        apiFetch(`/api/trades?accountId=${id}`)
          .then((trades) => [id, trades.reduce((s, t) => s + (Number(t.pnl) || 0), 0)])
          .catch(() => [id, 0])
      )
    ).then((entries) => { if (!cancelled) setPnlMap(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [idsKey]);

  return pnlMap;
}

export function useTrades(accountId) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/trades?accountId=${accountId}`)
      .then((data) => { if (!cancelled) { setTrades(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [accountId]);

  const addTrade = async (body) => {
    const trade = await apiFetch('/api/trades', {
      method: 'POST',
      body: JSON.stringify({ accountId, ...body }),
    });
    setTrades((prev) => [...prev, trade]);
    return trade;
  };

  const updateTrade = async (id, body) => {
    const updated = await apiFetch(`/api/trades?id=${id}&accountId=${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    setTrades((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTrade = async (id) => {
    await apiFetch(`/api/trades?id=${id}&accountId=${accountId}`, { method: 'DELETE' });
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  return { trades, loading, addTrade, updateTrade, deleteTrade };
}

export function usePayouts(accountId) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/payouts?accountId=${accountId}`)
      .then((data) => { if (!cancelled) { setPayouts(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [accountId]);

  const addPayout = async (body) => {
    const payout = await apiFetch('/api/payouts', {
      method: 'POST',
      body: JSON.stringify({ accountId, ...body }),
    });
    setPayouts((prev) => [...prev, payout]);
    return payout;
  };

  const updatePayout = async (id, body) => {
    const updated = await apiFetch(`/api/payouts?id=${id}&accountId=${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    setPayouts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePayout = async (id) => {
    await apiFetch(`/api/payouts?id=${id}&accountId=${accountId}`, { method: 'DELETE' });
    setPayouts((prev) => prev.filter((p) => p.id !== id));
  };

  return { payouts, loading, addPayout, updatePayout, deletePayout };
}

const EMPTY_TRADING_PLAN = { days: {}, progress: { consecutiveCleanTrades: 0, bestStreak: 0, resetLog: [] } };

export function useTradingPlan() {
  const [doc, setDoc] = useState(EMPTY_TRADING_PLAN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/trading-plan')
      .then((data) => { if (!cancelled) { setDoc(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Toggle a Before Trading / End of Day checklist item for the given date
  const updateSection = async (date, section, patch) => {
    const updatedDay = await apiFetch(`/api/trading-plan?date=${date}&section=${section}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setDoc((prev) => ({ ...prev, days: { ...prev.days, [date]: updatedDay } }));
    return updatedDay;
  };

  // Log a Before/After Every Trade rule check for the given date
  const logTrade = async (date, fields) => {
    const result = await apiFetch('/api/trading-plan', {
      method: 'POST',
      body: JSON.stringify({ date, ...fields }),
    });
    setDoc((prev) => ({
      ...prev,
      days: { ...prev.days, [date]: result.day },
      progress: result.progress,
    }));
    return result;
  };

  return { doc, loading, updateSection, logTrade };
}
