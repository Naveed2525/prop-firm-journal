import { useState } from 'react';
import PayoutModal from './PayoutModal';

function fmtDate(d) {
  if (!d) return '—';
  const [y, mo, day] = d.split('-').map(Number);
  return new Date(y, mo - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtUSD(n) {
  if (n === undefined || n === null || n === '') return '—';
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function CheckRow({ passed, label, detail }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
        passed
          ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
          : 'bg-red-100 dark:bg-red-950 text-red-500 dark:text-red-400'
      }`}>
        {passed ? '✓' : '✗'}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">{detail}</span>
      </div>
    </div>
  );
}

export default function Payouts({ m, rules, payouts, loading, addPayout, updatePayout, deletePayout, account }) {
  const [showModal, setShowModal] = useState(false);
  const [editingPayout, setEditingPayout] = useState(null);

  // Resolve payout rules from account (set in EditAccountModal), with defaults
  const pr = account?.payoutRules ?? {};
  const minWinningDays = pr.minWinningDays ?? 5;
  const minProfitPerDay = pr.minProfitPerDay ?? 0;
  const maxPayoutPct = pr.maxPayoutPct ?? 50;
  const maxPayoutCap = pr.maxPayoutCap ?? 0;

  // P&L since last received payout (cycle-based)
  const cyclePnL = m.pnlSinceLastPayout ?? m.totalPnL;
  const lastPayoutDate = m.lastPayoutDate;

  // Count winning days in the current cycle based on configured threshold
  const winningDays = Object.entries(m.dailyPnls ?? {}).filter(([date, pnl]) => {
    if (lastPayoutDate && date <= lastPayoutDate) return false;
    return minProfitPerDay > 0 ? pnl >= minProfitPerDay : pnl > 0;
  }).length;

  const winningDaysOk = winningDays >= minWinningDays;
  const profitOk = cyclePnL > 0;
  const allEligible = winningDaysOk && profitOk;

  // Eligible payout amount: maxPayoutPct of cycle P&L, capped by maxPayoutCap if set
  const rawEligible = Math.max(cyclePnL * (maxPayoutPct / 100), 0);
  const eligibleAmount = maxPayoutCap > 0 ? Math.min(rawEligible, maxPayoutCap) : rawEligible;

  const totalReceived = payouts.reduce((sum, p) =>
    p.status === 'received' ? sum + (Number(p.amountReceived) || 0) : sum, 0);
  const receivedCount = payouts.filter((p) => p.status === 'received').length;
  const nextNumber = payouts.length > 0 ? Math.max(...payouts.map((p) => p.number)) + 1 : 1;

  const sorted = [...payouts].sort((a, b) => a.number - b.number);

  const winDayDetail = `${winningDays} / ${minWinningDays} days${minProfitPerDay > 0 ? ` (+$${minProfitPerDay.toLocaleString()} min)` : ' (any profit)'}`;

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Payouts</h3>
          <button
            onClick={() => { setEditingPayout(null); setShowModal(true); }}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log Payout
          </button>
        </div>

        {/* Eligibility Tracker */}
        <div className="mx-4 mb-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payout Eligibility</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              allEligible
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
            }`}>
              {allEligible ? '✓ Eligible' : '✗ Not Yet'}
            </span>
          </div>

          <CheckRow
            passed={winningDaysOk}
            label={`Winning days (${minWinningDays} required)`}
            detail={winDayDetail}
          />
          <CheckRow
            passed={profitOk}
            label="Profitable since last payout"
            detail={lastPayoutDate
              ? `Since last payout: ${fmtUSD(cyclePnL)}`
              : `Current P&L: ${fmtUSD(m.totalPnL)}`}
          />

          {/* Eligible amount row */}
          {profitOk && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Eligible to withdraw ({maxPayoutPct}%{maxPayoutCap > 0 ? ` · $${maxPayoutCap.toLocaleString()} cap` : ''})
              </span>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">{fmtUSD(eligibleAmount)}</span>
            </div>
          )}
        </div>

        {/* Payout History */}
        {loading ? (
          <div className="px-4 pb-4 text-xs text-gray-400 dark:text-gray-500">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="px-4 pb-5 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">No payouts logged yet. Hit "Log Payout" when you request one.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((p) => (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Payout #{p.number}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(p.date)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400 dark:text-gray-500 mb-0.5">Requested</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{fmtUSD(p.amountRequested)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-gray-500 mb-0.5">Received</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">{fmtUSD(p.amountReceived)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-gray-500 mb-0.5">Balance</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{fmtUSD(p.balanceAfter)}</p>
                      </div>
                    </div>
                    {p.notes ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">{p.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => updatePayout(p.id, { status: p.status === 'received' ? 'pending' : 'received' })}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        p.status === 'received'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}
                    >
                      {p.status === 'received' ? 'Received' : 'Pending'}
                    </button>
                    <button
                      onClick={() => { setEditingPayout(p); setShowModal(true); }}
                      className="text-gray-300 dark:text-gray-600 hover:text-blue-400 dark:hover:text-blue-400 transition-colors"
                      title="Edit payout"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete Payout #${p.number}?`)) deletePayout(p.id);
                      }}
                      className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Total row */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Total Received{receivedCount > 0 ? ` (${receivedCount} paid)` : ''}
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{fmtUSD(totalReceived)}</span>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <PayoutModal
          payoutNumber={editingPayout ? editingPayout.number : nextNumber}
          initialData={editingPayout}
          accountSize={account?.size ?? 0}
          totalPnL={m.totalPnL ?? 0}
          previousPayoutsReceived={
            editingPayout && editingPayout.status === 'received'
              ? totalReceived - (Number(editingPayout.amountReceived) || 0)
              : totalReceived
          }
          onSave={editingPayout
            ? (form) => updatePayout(editingPayout.id, form)
            : addPayout
          }
          onClose={() => { setShowModal(false); setEditingPayout(null); }}
        />
      )}
    </>
  );
}
