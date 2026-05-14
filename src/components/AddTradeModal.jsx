import { useRef, useState, useEffect } from 'react';

const INSTRUMENTS = ['ES', 'NQ', 'MES', 'MNQ', 'YM', 'MYM', 'RTY', 'M2K', 'CL', 'MCL', 'GC', 'MGC', 'SI', 'NG', 'ZB', 'ZN', '6E', '6J', 'BTC'];

const TICK_VALUES = {
  ES: 12.50, MES: 1.25, NQ: 5.00, MNQ: 0.50,
  YM: 5.00, MYM: 0.50, RTY: 5.00, M2K: 0.50,
  CL: 10.00, MCL: 1.00, GC: 10.00, MGC: 1.00,
  SI: 25.00, NG: 10.00, ZB: 31.25, ZN: 15.625,
};

const TICK_SIZES = {
  ES: 0.25, MES: 0.25, NQ: 0.25, MNQ: 0.25,
  YM: 1, MYM: 1, RTY: 0.10, M2K: 0.10,
  CL: 0.01, MCL: 0.01, GC: 0.10, MGC: 0.10,
  SI: 0.005, NG: 0.001, ZB: 0.03125, ZN: 0.015625,
};

function resizeImage(file, maxPx, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

function timeToSeconds(t) {
  if (!t) return null;
  const parts = t.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function secondsToDuration(secs) {
  if (secs == null || secs < 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AddTradeModal({ onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today, instrument: 'ES', tradeName: '',
    direction: 'Long',
    entryTime: '', exitTime: '',
    entry: '', exit: '', contracts: '1',
    pnl: '', stopLoss: '', notes: '',
  });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [autoPnl, setAutoPnl] = useState(null);
  const [duration, setDuration] = useState(null);
  const fileInputRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Auto-calculate duration from entry/exit time
  useEffect(() => {
    const e = timeToSeconds(form.entryTime);
    const x = timeToSeconds(form.exitTime);
    if (e != null && x != null && x > e) {
      setDuration(secondsToDuration(x - e));
    } else {
      setDuration(null);
    }
  }, [form.entryTime, form.exitTime]);

  // Auto-calculate P&L from entry/exit price + contracts + direction
  useEffect(() => {
    const entry = parseFloat(form.entry);
    const exit = parseFloat(form.exit);
    const contracts = parseInt(form.contracts) || 1;
    const tickSize = TICK_SIZES[form.instrument] || 0.25;
    const tickValue = TICK_VALUES[form.instrument] || 5;
    if (!isNaN(entry) && !isNaN(exit)) {
      const rawTicks = (exit - entry) / tickSize;
      const directionMultiplier = form.direction === 'Short' ? -1 : 1;
      const pnl = parseFloat((rawTicks * tickValue * contracts * directionMultiplier).toFixed(2));
      setAutoPnl(pnl);
      setForm(f => ({ ...f, pnl: String(pnl) }));
    } else {
      setAutoPnl(null);
    }
  }, [form.entry, form.exit, form.contracts, form.instrument, form.direction]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    Promise.all(files.map((f) => resizeImage(f, 1280, 0.75))).then((b64s) =>
      setImages((prev) => [...prev, ...b64s])
    );
    e.target.value = '';
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    const pnlNum = parseFloat(form.pnl);
    if (isNaN(pnlNum)) { setErr('Enter a valid P&L number.'); return; }
    const stopLossNum = form.stopLoss !== '' ? parseFloat(form.stopLoss) : null;
    const entryNum = form.entry !== '' ? parseFloat(form.entry) : null;
    const exitNum = form.exit !== '' ? parseFloat(form.exit) : null;
    const contractsNum = parseInt(form.contracts) || 1;
    const entryTime = form.entryTime || null;
    const exitTime = form.exitTime || null;
    const durationStr = duration || null;
    setSaving(true);
    try {
      await onSave({
        ...form, pnl: pnlNum, stopLoss: stopLossNum,
        entry: entryNum, exit: exitNum,
        contracts: contractsNum,
        entryTime, exitTime, duration: durationStr, images,
      });
      onClose();
    } catch (ex) {
      setErr(ex.message);
      setSaving(false);
    }
  };

  const pnlColor = autoPnl != null ? (autoPnl >= 0 ? '#16a34a' : '#dc2626') : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-end">
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-3xl w-full p-6 overflow-y-auto" style={{ maxHeight: '92vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log Trade</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white w-8 h-8 flex items-center justify-center text-2xl leading-none rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Date + Instrument */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" value={form.date} onChange={set('date')} required className="input" />
            </Field>
            <Field label="Instrument">
              <select value={form.instrument} onChange={set('instrument')} className="input">
                {INSTRUMENTS.map((i) => <option key={i}>{i}</option>)}
              </select>
            </Field>
          </div>

          {/* Trade Name */}
          <Field label="Trade Name (optional)">
            <input type="text" placeholder='e.g. "Morning Breakout" or "Trade 1"' value={form.tradeName} onChange={set('tradeName')} className="input" />
          </Field>

          {/* Direction toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, direction: 'Long' }))}
              className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
              style={form.direction === 'Long'
                ? { background: '#16a34a', color: '#fff', boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }
                : { background: 'transparent', color: '#16a34a', border: '2px solid #16a34a' }}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, direction: 'Short' }))}
              className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
              style={form.direction === 'Short'
                ? { background: '#dc2626', color: '#fff', boxShadow: '0 2px 8px rgba(220,38,38,0.35)' }
                : { background: 'transparent', color: '#dc2626', border: '2px solid #dc2626' }}
            >
              Short
            </button>
          </div>

          {/* Entry Time + Exit Time (with seconds) */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Entry Time">
              <input type="time" step="1" value={form.entryTime} onChange={set('entryTime')} className="input" />
            </Field>
            <Field label="Exit Time">
              <input type="time" step="1" value={form.exitTime} onChange={set('exitTime')} className="input" />
            </Field>
          </div>

          {/* Duration — auto calculated */}
          {duration && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-xl">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">⏱ Trade duration:</span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{duration}</span>
            </div>
          )}

          {/* Entry Price + Exit Price + Contracts */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Entry Price">
              <input type="number" step="0.01" placeholder="e.g. 21450" value={form.entry} onChange={set('entry')} className="input" inputMode="decimal" />
            </Field>
            <Field label="Exit Price">
              <input type="number" step="0.01" placeholder="e.g. 21460" value={form.exit} onChange={set('exit')} className="input" inputMode="decimal" />
            </Field>
            <Field label="Contracts">
              <input type="number" step="1" min="1" placeholder="1" value={form.contracts} onChange={set('contracts')} className="input" inputMode="numeric" />
            </Field>
          </div>

          {/* Day P&L — auto filled but editable + Risk/Stop */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={autoPnl != null ? 'Day P&L (auto-calculated)' : 'Day P&L ($)'}>
              <input
                type="number" step="0.01" placeholder="e.g. 350 or -125"
                value={form.pnl} onChange={set('pnl')} required
                className="input text-xl font-semibold"
                inputMode="decimal"
                style={{ color: pnlColor }}
              />
            </Field>
            <Field label="Risk / Stop ($)">
              <input type="number" step="0.01" placeholder="e.g. 200" value={form.stopLoss} onChange={set('stopLoss')} className="input text-xl font-semibold" inputMode="decimal" />
            </Field>
          </div>

          {/* Auto P&L hint */}
          {autoPnl != null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: autoPnl >= 0 ? '#f0fdf4' : '#fff1f2' }}>
              <span className="text-xs font-medium" style={{ color: autoPnl >= 0 ? '#16a34a' : '#dc2626' }}>
                {autoPnl >= 0 ? '📈' : '📉'} Auto P&L from entry/exit: {autoPnl >= 0 ? '+' : ''}${autoPnl.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400">(you can override)</span>
            </div>
          )}

          {/* Notes */}
          <Field label="Notes (optional)">
            <textarea rows={2} placeholder="Quick notes…" value={form.notes} onChange={set('notes')} className="input resize-none" />
          </Field>

          {/* Screenshots */}
          <Field label="Screenshots (optional)">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            {images.length === 0 ? (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-3 hover:border-blue-400 hover:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                Add chart screenshots
              </button>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {images.map((src, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center leading-none shadow-sm transition-colors">×</button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center text-xl text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors">+</button>
              </div>
            )}
          </Field>

          {err && <p className="text-red-600 dark:text-red-400 text-sm">{err}</p>}

          <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-4 font-semibold text-base transition-colors">
            {saving ? 'Saving…' : 'Save Trade'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  );
}
