export function computeTotalCost(costs) {
  if (!costs) return 0;
  return (
    (Number(costs.evalFee) || 0) +
    (Number(costs.platformFee) || 0) * (Number(costs.platformFeeMonths) || 0) +
    (costs.resets ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0) +
    (costs.other ?? []).reduce((s, o) => s + (Number(o.amount) || 0), 0)
  );
}

export function getCostEvents(costs, startDate) {
  if (!costs) return [];
  const events = [];

  const evalFee = Number(costs.evalFee) || 0;
  if (evalFee > 0 && startDate) {
    events.push({ date: startDate, amount: evalFee, label: 'Eval Fee' });
  }

  for (const r of (costs.resets ?? [])) {
    const amt = Number(r.amount) || 0;
    if (amt > 0 && r.date) events.push({ date: r.date, amount: amt, label: 'Reset' });
  }

  for (const o of (costs.other ?? [])) {
    const amt = Number(o.amount) || 0;
    if (amt > 0 && o.date) events.push({ date: o.date, amount: amt, label: o.description || 'Other' });
  }

  const platformFee = Number(costs.platformFee) || 0;
  const platformMonths = Number(costs.platformFeeMonths) || 0;
  if (platformFee > 0 && platformMonths > 0 && startDate) {
    for (let i = 0; i < platformMonths; i++) {
      const d = new Date(startDate + 'T12:00:00');
      d.setMonth(d.getMonth() + i);
      events.push({ date: d.toISOString().slice(0, 10), amount: platformFee, label: 'Platform Fee' });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function periodKey(date, period) {
  if (!date || date.length < 7) return 'Unknown';
  if (period === 'yearly') return date.slice(0, 4);
  if (period === 'monthly') return date.slice(0, 7);
  if (period === 'weekly') {
    const d = new Date(date + 'T12:00:00');
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  return date.slice(0, 10);
}

export function periodLabel(key, period) {
  if (period === 'yearly') return key;
  if (period === 'monthly') {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1);
    return d.toLocaleString('default', { month: 'short', year: 'numeric' });
  }
  if (period === 'weekly') return key;
  const d = new Date(key + 'T12:00:00');
  return d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: '2-digit' });
}

const uid = () => Math.random().toString(36).slice(2);

export function initCosts(accountCosts) {
  if (!accountCosts) return { evalFee: '', platformFee: '', platformFeeMonths: '', resets: [], other: [] };
  return {
    evalFee: accountCosts.evalFee ? String(accountCosts.evalFee) : '',
    platformFee: accountCosts.platformFee ? String(accountCosts.platformFee) : '',
    platformFeeMonths: accountCosts.platformFeeMonths ? String(accountCosts.platformFeeMonths) : '',
    resets: (accountCosts.resets ?? []).map((r) => ({
      id: r.id || uid(),
      date: r.date || new Date().toISOString().slice(0, 10),
      amount: r.amount ? String(r.amount) : '',
    })),
    other: (accountCosts.other ?? []).map((o) => ({
      id: o.id || uid(),
      date: o.date || new Date().toISOString().slice(0, 10),
      amount: o.amount ? String(o.amount) : '',
      description: o.description || '',
    })),
  };
}

export function serializeCosts(costs) {
  return {
    evalFee: Number(costs.evalFee) || 0,
    platformFee: Number(costs.platformFee) || 0,
    platformFeeMonths: Number(costs.platformFeeMonths) || 0,
    resets: (costs.resets ?? [])
      .map((r) => ({ id: r.id, date: r.date, amount: Number(r.amount) || 0 }))
      .filter((r) => r.amount > 0),
    other: (costs.other ?? [])
      .map((o) => ({ id: o.id, date: o.date, amount: Number(o.amount) || 0, description: o.description }))
      .filter((o) => o.amount > 0),
  };
}

const uid2 = () => Math.random().toString(36).slice(2);
export function newReset() {
  return { id: uid2(), date: new Date().toISOString().slice(0, 10), amount: '' };
}
export function newOther() {
  return { id: uid2(), date: new Date().toISOString().slice(0, 10), amount: '', description: '' };
}
