function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function fmtShort(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDay(trades) {
  const map = {};
  for (const t of trades) {
    const k = t.date.slice(0, 10);
    map[k] = (map[k] ?? 0) + t.pnl;
  }
  return map;
}

function calcStats(byDay) {
  const days = Object.keys(byDay).sort();
  if (days.length === 0) {
    return { days, vals: [], total: 0, wins: 0, losses: 0, maxVal: 0, minVal: 0, bestDay: null, worstDay: null, posSum: 0, consistencyPct: 0, winRate: 0, avgDaily: 0 };
  }
  const vals = days.map(d => byDay[d]);
  const total = vals.reduce((s, v) => s + v, 0);
  const wins = vals.filter(v => v > 0).length;
  const losses = vals.filter(v => v < 0).length;
  const maxVal = Math.max(...vals);
  const minVal = Math.min(...vals);
  const posSum = vals.filter(v => v > 0).reduce((s, v) => s + v, 0);
  const bestDay = days[vals.indexOf(maxVal)];
  const worstDay = days[vals.indexOf(minVal)];
  const consistencyPct = posSum > 0 ? maxVal / posSum : 0;
  const winRate = (wins + losses) > 0 ? wins / (wins + losses) : 0;
  const avgDaily = total / days.length;
  return { days, vals, total, wins, losses, maxVal, minVal, bestDay, worstDay, posSum, consistencyPct, winRate, avgDaily };
}

function topInstr(trades) {
  const map = {};
  for (const t of trades) {
    if (t.instrument) map[t.instrument] = (map[t.instrument] ?? 0) + 1;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function computeWeekReport(trades, weekOffset) {
  const mon = getMonday(new Date());
  mon.setDate(mon.getDate() + weekOffset * 7);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);

  const start = toDateStr(mon);
  const end = toDateStr(sun);
  const filtered = trades.filter(t => { const d = t.date.slice(0, 10); return d >= start && d <= end; });
  const byDay = groupByDay(filtered);
  const { days, total, wins, losses, maxVal, minVal, bestDay, worstDay, consistencyPct, winRate, avgDaily } = calcStats(byDay);

  return {
    periodLabel: `${fmtShort(start)} – ${fmtShort(end)}`,
    weekNumber: isoWeek(mon),
    year: mon.getFullYear(),
    start, end,
    totalPnL: +total.toFixed(2),
    tradingDays: days.length,
    wins, losses, winRate,
    avgDaily: +avgDaily.toFixed(2),
    bestDay, bestDayPnL: bestDay ? parseFloat(byDay[bestDay].toFixed(2)) : 0,
    worstDay, worstDayPnL: worstDay ? parseFloat(byDay[worstDay].toFixed(2)) : 0,
    topInstrument: topInstr(filtered),
    consistencyPct,
    isEmpty: filtered.length === 0,
    byDay, trades: filtered,
  };
}

export function computeMonthReport(trades, monthOffset, rules) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const yr = target.getFullYear();
  const mo = target.getMonth();
  const lastDay = new Date(yr, mo + 1, 0).getDate();
  const start = `${yr}-${String(mo + 1).padStart(2, '0')}-01`;
  const end = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const filtered = trades.filter(t => { const d = t.date.slice(0, 10); return d >= start && d <= end; });
  const byDay = groupByDay(filtered);
  const { days, total, wins, losses, bestDay, worstDay, consistencyPct, winRate, avgDaily } = calcStats(byDay);

  // Group trading days into weekly buckets (keyed by Monday of that week)
  const weekBuckets = {};
  for (const day of days) {
    const mon = toDateStr(getMonday(new Date(day + 'T12:00:00')));
    weekBuckets[mon] = (weekBuckets[mon] ?? 0) + byDay[day];
  }
  const weekArr = Object.entries(weekBuckets).sort(([a], [b]) => a.localeCompare(b));
  const bestW = weekArr.length ? weekArr.reduce((b, c) => c[1] > b[1] ? c : b) : null;
  const worstW = weekArr.length ? weekArr.reduce((w, c) => c[1] < w[1] ? c : w) : null;

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return {
    periodLabel: `${MONTHS[mo]} ${yr}`,
    year: yr, month: mo,
    totalPnL: +total.toFixed(2),
    tradingDays: days.length,
    wins, losses, winRate,
    avgDaily: +avgDaily.toFixed(2),
    topInstrument: topInstr(filtered),
    bestWeek: bestW ? { date: bestW[0], pnl: +bestW[1].toFixed(2) } : null,
    worstWeek: worstW ? { date: worstW[0], pnl: +worstW[1].toFixed(2) } : null,
    ptProgress: rules?.profitTarget > 0 ? Math.max(total, 0) / rules.profitTarget : null,
    consistencyPct,
    isEmpty: filtered.length === 0,
    byDay, trades: filtered, rules,
  };
}
