import { useState, useEffect, useMemo } from 'react';
import { useFirms } from '../context/FirmsContext';
import { computeTotalCost, getCostEvents, periodKey, periodLabel } from '../utils/costs';

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

export default function ExpensesDashboard({ accounts }) {
  const { firms } = useFirms();
  const [payoutEvents, setPayoutEvents] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiFetch('/api/expenses')
      .then((d) => setPayoutEvents(d.payoutEvents ?? []))
      .catch(() => {});
  }, [open]);

  const totalSpent = accounts.reduce((s, a) => s + computeTotalCost(a.costs), 0);
  const totalPayouts = payoutEvents.reduce((s, e) => s + e.amount, 0);

  // All dated cost events across every account
  const allCostEvents = useMemo(() => {
    const events = [];
    for (const acc of accounts) {
      const startDate = acc.startDate ?? acc.createdAt?.slice(0, 10);
      for (const ev of getCostEvents(acc.costs, startDate)) {
        events.push({ ...ev, firm: acc.firm });
      }
    }
    return events;
  }, [accounts]);

  // Per-firm breakdown
  const byFirm = {};
  for (const acc of accounts) {
    const cost = computeTotalCost(acc.costs);
    if (!byFirm[acc.firm]) byFirm[acc.firm] = { cost: 0, payouts: 0, name: firms[acc.firm]?.name ?? acc.firm, color: firms[acc.firm]?.color };
    byFirm[acc.firm].cost += cost;
  }
  for (const ev of payoutEvents) {
    if (!byFirm[ev.firm]) byFirm[ev.firm] = { cost: 0, payouts: 0, name: firms[ev.firm]?.name ?? ev.firm, color: firms[ev.firm]?.color };
    byFirm[ev.firm].payouts += ev.amount;
  }

  // Per-period spending (from dated cost events)
  const spendByPeriod = {};
  for (const ev of allCostEvents) {
    const key = periodKey(ev.date, period);
    spendByPeriod[key] = (spendByPeriod[key] ?? 0) + ev.amount;
  }
  const spendRows = Object.entries(spendByPeriod).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  // Per-period payouts
  const payoutByPeriod = {};
  for (const ev of payoutEvents) {
    const key = periodKey(ev.date, period);
    payoutByPeriod[key] = (payoutByPeriod[key] ?? 0) + ev.amount;
  }
  const payoutRows = Object.entries(payoutByPeriod).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  // Combined cashflow — union of all period keys with both figures
  const allPeriodKeys = new Set([...Object.keys(spendByPeriod), ...Object.keys(payoutByPeriod)]);
  const cashflowRows = [...allPeriodKeys]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 12)
    .map((key) => ({ key, spent: spendByPeriod[key] ?? 0, payouts: payoutByPeriod[key] ?? 0 }));

  const hasCostEvents = allCostEvents.length > 0;
  const hasPayoutEvents = payoutEvents.length > 0;
  const showCashflow = hasCostEvents && hasPayoutEvents;
  const showPeriodSection = hasCostEvents || hasPayoutEvents;

  if (totalSpent === 0 && !hasPayoutEvents && !open) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Expenses Dashboard</span>
          {totalSpent > 0 && (
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              −${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
            </span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-5 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-5">

          {/* Business Overview */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 pt-1">Business Overview</p>
            <div className="grid grid-cols-2 gap-2">
              <SummaryTile
                label="Total Spent"
                value={`−$${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                color="text-red-600 dark:text-red-400"
              />
              <SummaryTile
                label="Total Payouts"
                value={`+$${totalPayouts.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                color="text-green-600 dark:text-green-400"
              />
            </div>
          </div>

          {/* By Firm */}
          {Object.keys(byFirm).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">By Firm</p>
              <div className="space-y-2">
                {Object.entries(byFirm).map(([key, f]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: f.color }}>{f.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      {f.cost > 0 && (
                        <span className="text-red-600 dark:text-red-400">−${f.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent</span>
                      )}
                      {f.payouts > 0 && (
                        <span className="text-green-600 dark:text-green-400">+${f.payouts.toLocaleString(undefined, { maximumFractionDigits: 0 })} paid out</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Period sections — shared toggle */}
          {showPeriodSection && (
            <>
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Period View</p>
                <div className="flex gap-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        period === p
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payouts by Period */}
              {hasPayoutEvents && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Payouts by Period</p>
                  {payoutRows.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-1">No payouts</p>
                  ) : (
                    <div className="space-y-1.5">
                      {payoutRows.map(([key, amt]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{periodLabel(key, period)}</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            +${amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Spending by Period */}
              {hasCostEvents && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Spending by Period</p>
                  {spendRows.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-1">No dated costs</p>
                  ) : (
                    <div className="space-y-1.5">
                      {spendRows.map(([key, amt]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{periodLabel(key, period)}</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            −${amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cashflow by Period — spending and payouts side by side */}
              {showCashflow && cashflowRows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Cashflow by Period</p>
                  <div className="space-y-1.5">
                    {cashflowRows.map(({ key, spent, payouts }) => (
                      <div key={key} className="flex items-center justify-between text-sm gap-2">
                        <span className="text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{periodLabel(key, period)}</span>
                        <div className="flex items-center gap-3 text-xs ml-auto">
                          {spent > 0 && (
                            <span className="text-red-600 dark:text-red-400">
                              −${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          )}
                          {payouts > 0 && (
                            <span className="text-green-600 dark:text-green-400">
                              +${payouts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, color }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2.5">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}
