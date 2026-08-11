// Shared helpers for the Trading Plan feature (My Plan + Daily Checklist tabs).

// Local calendar date (not UTC) — the checklist resets at the user's own
// midnight, not UTC midnight, so this must match their wall-clock day.
export function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 'YYYY-MM-DD' -> "Tuesday, June 10, 2026". Parses as local time (not UTC)
// so the weekday never shifts by a day near midnight in negative-UTC zones.
export function formatDisplayDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function defaultDay() {
  return {
    before: { affirmation: false, positionSize: false, marketConditions: false },
    trades: [],
    endOfDay: { noRevenge: false, positionSizeRules: false, maxTrades: false },
  };
}

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

export function currentWeekRange() {
  const mon = getMonday(new Date());
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return { start: toDateStr(mon), end: toDateStr(sun) };
}

// Rolls up this week's daily checklist + trade-check records into compliance percentages.
export function computeWeeklySummary(days = {}) {
  const { start, end } = currentWeekRange();
  const weekDates = Object.keys(days).filter((d) => d >= start && d <= end).sort();

  let totalTrades = 0;
  let cleanTrades = 0;
  let checklistItems = 0;
  let checklistDone = 0;
  let daysTracked = 0;

  for (const date of weekDates) {
    const day = days[date];
    if (!day) continue;
    daysTracked += 1;

    const trades = day.trades ?? [];
    totalTrades += trades.length;
    cleanTrades += trades.filter((t) => t.clean).length;

    const beforeVals = Object.values(day.before ?? {});
    const endVals = Object.values(day.endOfDay ?? {});
    checklistItems += beforeVals.length + endVals.length;
    checklistDone += beforeVals.filter(Boolean).length + endVals.filter(Boolean).length;
  }

  return {
    start,
    end,
    daysTracked,
    totalTrades,
    cleanTrades,
    tradeCompliancePct: totalTrades > 0 ? Math.round((cleanTrades / totalTrades) * 100) : null,
    checklistCompliancePct: checklistItems > 0 ? Math.round((checklistDone / checklistItems) * 100) : null,
  };
}
