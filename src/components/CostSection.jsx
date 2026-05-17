import { useState } from 'react';
import { computeTotalCost, newReset, newOther } from '../utils/costs';

export default function CostSection({ costs, onChange }) {
  const [open, setOpen] = useState(false);

  const set = (patch) => onChange({ ...costs, ...patch });

  const addReset = () => set({ resets: [...(costs.resets ?? []), newReset()] });
  const removeReset = (id) => set({ resets: costs.resets.filter((r) => r.id !== id) });
  const patchReset = (id, p) => set({ resets: costs.resets.map((r) => (r.id === id ? { ...r, ...p } : r)) });

  const addOther = () => set({ other: [...(costs.other ?? []), newOther()] });
  const removeOther = (id) => set({ other: costs.other.filter((o) => o.id !== id) });
  const patchOther = (id, p) => set({ other: costs.other.map((o) => (o.id === id ? { ...o, ...p } : o)) });

  const totalCost = computeTotalCost({
    evalFee: Number(costs.evalFee) || 0,
    platformFee: Number(costs.platformFee) || 0,
    platformFeeMonths: Number(costs.platformFeeMonths) || 0,
    resets: (costs.resets ?? []).map((r) => ({ amount: Number(r.amount) || 0 })),
    other: (costs.other ?? []).map((o) => ({ amount: Number(o.amount) || 0 })),
  });

  const hasPlatform = (Number(costs.platformFee) || 0) > 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Costs & Fees</span>
          {totalCost > 0 && (
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              −${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          )}
          {totalCost === 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">optional</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100 dark:border-gray-800">
          {/* Eval + Platform */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">Eval Fee</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
                <input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={costs.evalFee}
                  onChange={(e) => set({ evalFee: e.target.value })}
                  className="input pl-7 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">Platform Fee/mo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
                <input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={costs.platformFee}
                  onChange={(e) => set({ platformFee: e.target.value })}
                  className="input pl-7 text-sm"
                />
              </div>
            </div>
          </div>

          {hasPlatform && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
                Platform Fee Months
                {hasPlatform && costs.platformFeeMonths && (
                  <span className="ml-2 font-normal text-gray-400">
                    = ${((Number(costs.platformFee) || 0) * (Number(costs.platformFeeMonths) || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} total
                  </span>
                )}
              </label>
              <input
                type="number" min="0" step="1" placeholder="e.g. 3"
                value={costs.platformFeeMonths}
                onChange={(e) => set({ platformFeeMonths: e.target.value })}
                className="input text-sm w-28"
              />
            </div>
          )}

          {/* Resets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Account Resets</label>
              <button
                type="button"
                onClick={addReset}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
              >
                + Add Reset
              </button>
            </div>
            {(costs.resets ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-1">No resets</p>
            ) : (
              <div className="space-y-2">
                {costs.resets.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <input
                      type="date"
                      value={r.date}
                      onChange={(e) => patchReset(r.id, { date: e.target.value })}
                      className="input flex-1 text-sm py-1.5"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
                      <input
                        type="number" min="0" step="0.01" placeholder="0"
                        value={r.amount}
                        onChange={(e) => patchReset(r.id, { amount: e.target.value })}
                        className="input pl-7 text-sm py-1.5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReset(r.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other costs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Other Costs</label>
              <button
                type="button"
                onClick={addOther}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
              >
                + Add Cost
              </button>
            </div>
            {(costs.other ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-1">No other costs</p>
            ) : (
              <div className="space-y-3">
                {costs.other.map((o) => (
                  <div key={o.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text" placeholder="Description (e.g. Data feed)"
                        value={o.description}
                        onChange={(e) => patchOther(o.id, { description: e.target.value })}
                        className="input flex-1 text-sm py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => removeOther(o.id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={o.date}
                        onChange={(e) => patchOther(o.id, { date: e.target.value })}
                        className="input text-sm py-1.5"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
                        <input
                          type="number" min="0" step="0.01" placeholder="0"
                          value={o.amount}
                          onChange={(e) => patchOther(o.id, { amount: e.target.value })}
                          className="input pl-7 text-sm py-1.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
