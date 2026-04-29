import { useState } from 'react';

export default function TradeList({ trades = [], onDelete }) {
  const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 dark:text-gray-500">
        <p className="text-3xl mb-2">📋</p>
        <p className="font-medium">No trades logged yet</p>
        <p className="text-sm mt-1 text-gray-400 dark:text-gray-600">Tap + to log your first day</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((t) => <TradeRow key={t.id} trade={t} onDelete={onDelete} />)}
    </div>
  );
}

function TradeRow({ trade, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const isProfit = trade.pnl >= 0;
  const [y, m, d] = trade.date.slice(0, 10).split('-');
  const dateStr = new Date(+y, +m - 1, +d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm dark:shadow-none">
      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isProfit ? 'bg-green-500' : 'bg-red-500'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{dateStr}</span>
          {trade.instrument && (
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              {trade.instrument}
            </span>
          )}
        </div>
        {trade.notes && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{trade.notes}</p>
        )}
      </div>
      <span className={`text-base font-bold flex-shrink-0 ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isProfit ? '+' : ''}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
      </span>
      {confirming ? (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => { onDelete(trade.id); setConfirming(false); }}
            className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 rounded-lg px-2 py-1.5 leading-none"
          >
            Delete
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1.5 leading-none"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 text-xl leading-none transition-colors flex-shrink-0"
          aria-label="Delete trade"
        >
          ×
        </button>
      )}
    </div>
  );
}
