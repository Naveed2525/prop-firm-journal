import { useEffect, useState } from 'react';

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
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const isProfit = trade.pnl >= 0;
  const [y, m, d] = trade.date.slice(0, 10).split('-');
  const dateStr = new Date(+y, +m - 1, +d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const imgs = trade.images ?? [];

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm dark:shadow-none">
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 mt-0.5 ${isProfit ? 'bg-green-500' : 'bg-red-500'}`} />

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
          {imgs.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {imgs.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-blue-400 dark:hover:ring-blue-500 active:scale-95 transition-all"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
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

      {lightboxIdx !== null && (
        <Lightbox
          images={imgs}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/50 text-sm font-medium">
          {images.length > 1 ? `${idx + 1} / ${images.length}` : 'Screenshot'}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white text-2xl rounded-full hover:bg-white/10 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center min-h-0 px-4 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[idx]}
          alt={`Screenshot ${idx + 1}`}
          className="max-w-full max-h-full object-contain rounded-xl"
          style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}
        />
      </div>

      {/* Arrows + dots */}
      {images.length > 1 && (
        <div
          className="flex items-center justify-between px-2 pb-10 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="w-12 h-12 flex items-center justify-center text-white/70 disabled:text-white/20 hover:text-white text-4xl rounded-full hover:bg-white/10 transition-colors"
          >
            ‹
          </button>
          <div className="flex gap-2 items-center">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all ${i === idx ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/35'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
            disabled={idx === images.length - 1}
            className="w-12 h-12 flex items-center justify-center text-white/70 disabled:text-white/20 hover:text-white text-4xl rounded-full hover:bg-white/10 transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
