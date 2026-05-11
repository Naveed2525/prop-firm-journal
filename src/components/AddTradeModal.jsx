import { useRef, useState } from 'react';

const INSTRUMENTS = ['ES', 'NQ', 'MES', 'MNQ', 'YM', 'MYM', 'RTY', 'M2K', 'CL', 'MCL', 'GC', 'MGC', 'SI', 'NG', 'ZB', 'ZN', '6E', '6J', 'BTC'];

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
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

export default function AddTradeModal({ onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, pnl: '', instrument: 'ES', notes: '', tradeName: '', stopLoss: '' });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const fileInputRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
    setSaving(true);
    try {
      await onSave({ ...form, pnl: pnlNum, stopLoss: stopLossNum, images });
      onClose();
    } catch (ex) {
      setErr(ex.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-end">
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-3xl w-full p-6 pb-safe">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log Trade Day</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white w-8 h-8 flex items-center justify-center text-2xl leading-none rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Field label="Trade Name (optional)">
            <input
              type="text" placeholder='e.g. "Morning Breakout" or "Trade 1"'
              value={form.tradeName} onChange={set('tradeName')}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Day P&L ($)">
              <input
                type="number" step="0.01" placeholder="e.g. 350 or -125"
                value={form.pnl} onChange={set('pnl')} required
                className="input text-xl font-semibold"
                inputMode="decimal"
              />
            </Field>
            <Field label="Risk / Stop ($)">
              <input
                type="number" step="0.01" placeholder="e.g. 200"
                value={form.stopLoss} onChange={set('stopLoss')}
                className="input text-xl font-semibold"
                inputMode="decimal"
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              rows={2} placeholder="Quick notes…"
              value={form.notes} onChange={set('notes')}
              className="input resize-none"
            />
          </Field>

          {/* Screenshots */}
          <Field label="Screenshots (optional)">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-3 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
              >
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
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center leading-none shadow-sm transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center text-xl text-gray-400 hover:border-blue-400 hover:text-blue-400 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </Field>

          {err && <p className="text-red-600 dark:text-red-400 text-sm">{err}</p>}

          <button
            type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-4 font-semibold text-base transition-colors"
          >
            {saving ? 'Saving…' : 'Save Trade Day'}
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
