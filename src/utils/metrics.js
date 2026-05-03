export function computeMetrics(trades = [], payouts = []) {
  // Payout-adjusted base values (needed even when no trades)
  const receivedPayouts = payouts
    .filter((p) => p.status === 'received')
    .sort((a, b) => a.date.localeCompare(b.date));
  const totalPayoutsReceived = receivedPayouts.reduce(
    (sum, p) => sum + (Number(p.amountReceived) || 0), 0
  );
  const lastPayoutDate = receivedPayouts.length > 0
    ? receivedPayouts[receivedPayouts.length - 1].date
    : null;

  if (trades.length === 0) {
    return {
      totalPnL: 0, peakPnL: 0, currentDrawdown: 0,
      todayPnL: 0, maxDayPnL: 0, minDayPnL: 0,
      consistencyPct: 0, tradeCount: 0, dayCount: 0,
      dailyPnls: {},
      totalPayoutsReceived,
      pnlSinceLastPayout: 0,
      lastPayoutDate,
    };
  }

  // Group by trading date (YYYY-MM-DD)
  const byDay = {};
  for (const t of trades) {
    const day = t.date.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + t.pnl;
  }

  const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));
  const dailyValues = days.map(([, v]) => v);

  const totalPnL = dailyValues.reduce((s, v) => s + v, 0);
  const maxDayPnL = Math.max(...dailyValues, 0);
  const minDayPnL = Math.min(...dailyValues, 0);

  // Today's P&L
  const today = new Date().toISOString().slice(0, 10);
  const todayPnL = byDay[today] ?? 0;

  // Consistency: largest profitable day as % of total profit
  const positivePnL = dailyValues.filter((v) => v > 0).reduce((s, v) => s + v, 0);
  const consistencyPct = positivePnL > 0 ? maxDayPnL / positivePnL : 0;

  // Full-history peak (for peakPnL reference)
  let running = 0;
  let peak = 0;
  for (const pnl of dailyValues) {
    running += pnl;
    if (running > peak) peak = running;
  }

  // Post-payout cycle: drawdown and P&L reset at last received payout
  let currentDrawdown;
  let pnlSinceLastPayout;

  if (lastPayoutDate) {
    const postDays = days.filter(([day]) => day > lastPayoutDate).map(([, v]) => v);
    pnlSinceLastPayout = postDays.reduce((s, v) => s + v, 0);

    // Trailing drawdown from post-payout high watermark
    let run2 = 0;
    let peak2 = 0;
    for (const pnl of postDays) {
      run2 += pnl;
      if (run2 > peak2) peak2 = run2;
    }
    currentDrawdown = Math.max(peak2 - run2, 0);
  } else {
    pnlSinceLastPayout = totalPnL;
    currentDrawdown = Math.max(peak - totalPnL, 0);
  }

  return {
    totalPnL,
    peakPnL: peak,
    currentDrawdown,
    todayPnL,
    maxDayPnL,
    minDayPnL,
    consistencyPct,
    tradeCount: trades.length,
    dayCount: days.length,
    dailyPnls: Object.fromEntries(days),
    totalPayoutsReceived,
    pnlSinceLastPayout,
    lastPayoutDate,
  };
}

export function getAlerts(metrics, rules) {
  if (!rules) return [];
  const alerts = [];
  const { totalPnL, currentDrawdown, todayPnL, consistencyPct, pnlSinceLastPayout } = metrics;
  const { profitTarget, maxDrawdown, dailyLossLimit, consistencyRule, hasDLL } = rules;

  // Cycle P&L for profit target tracking (resets after each received payout)
  const cyclePnL = pnlSinceLastPayout ?? totalPnL;

  // --- Drawdown ---
  const ddPct = maxDrawdown > 0 ? currentDrawdown / maxDrawdown : 0;
  if (ddPct >= 1) {
    alerts.push({ level: 'danger', msg: 'MAX DRAWDOWN HIT — Account is blown. Stop trading.' });
  } else if (ddPct >= 0.9) {
    alerts.push({ level: 'danger', msg: `Drawdown at ${pct(ddPct)} of limit ($${fmt(currentDrawdown)} / $${fmt(maxDrawdown)}) — extreme risk!` });
  } else if (ddPct >= 0.75) {
    alerts.push({ level: 'warning', msg: `Drawdown at ${pct(ddPct)} of limit ($${fmt(currentDrawdown)} / $${fmt(maxDrawdown)}) — reduce size.` });
  }

  // --- Daily loss limit ---
  if (hasDLL && todayPnL < 0) {
    const dllPct = dailyLossLimit > 0 ? Math.abs(todayPnL) / dailyLossLimit : 0;
    if (dllPct >= 1) {
      alerts.push({ level: 'danger', msg: 'DAILY LOSS LIMIT HIT — Close all positions now!' });
    } else if (dllPct >= 0.8) {
      alerts.push({ level: 'warning', msg: `Daily loss at ${pct(dllPct)} of DLL ($${fmt(Math.abs(todayPnL))} / $${fmt(dailyLossLimit)})` });
    }
  }

  // --- Consistency ---
  if (totalPnL > 0 && consistencyPct > consistencyRule) {
    alerts.push({
      level: 'warning',
      msg: `Consistency violation: best day = ${pct(consistencyPct)} of profits (limit ${pct(consistencyRule)}). Keep trading to dilute.`,
    });
  }

  // --- Near profit target (based on cycle P&L since last payout) ---
  if (cyclePnL > 0) {
    const ptPct = cyclePnL / profitTarget;
    if (ptPct >= 1) {
      alerts.push({ level: 'success', msg: `Profit target reached! $${fmt(cyclePnL)} / $${fmt(profitTarget)} — verify consistency before submitting.` });
    } else if (ptPct >= 0.9) {
      alerts.push({ level: 'info', msg: `${pct(ptPct)} to profit target — $${fmt(profitTarget - cyclePnL)} remaining.` });
    }
  }

  return alerts;
}

function fmt(n) { return Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 }); }
function pct(n) { return `${(n * 100).toFixed(0)}%`; }
