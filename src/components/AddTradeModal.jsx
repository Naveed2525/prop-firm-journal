import { useState } from 'react';

const INSTRUMENTS = ['ES', 'NQ', 'MES', 'MNQ', 'YM', 'MYM', 'RTY', 'M2K', 'CL', 'MCL', 'GC', 'MGC', 'SI', 'NG', 'ZB', 'ZN', '6E', '6J', 'BTC'];

export default function AddTradeModal({ onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, pnl: '', instrument: 'ES', notes: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    const pnlNum = parseFloat(form.pnl);
    if (isNaN(pnlNum)) { setErr('Enter a valid P&L number.'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, pnl: pnlNum });
      onClose();
    } catch (ex) {
      setErr(ex.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end">
      <div className="bg-gray-900 border-t border-gray-800 rounded-t-3xl w-full p-6 pb-safe">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Log Trade Day</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center text-2xl leading-none rounded-full hover:bg-gray-800">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date" value={form.date} onChange={set('date')} required
                className="input"
              />
            </Field>
            <Field label="Instrument">
              <select value={form.instrument} onChange={set('instrument')} className="input">
                {INSTRUMENTS.map((i) => <option key={i}>{i}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Day P&L ($)">
            <input
              type="number" step="0.01" placeholder="e.g. 350 or -125"
              value={form.pnl} onChange={set('pnl')} required
              className="input text-xl font-semibold"
              inputMode="decimal"
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              rows={2} placeholder="Quick notes..."
              value={form.notes} onChange={set('notes')}
              className="input resize-none"
            />
          </Field>

          {err && <p className="text-red-400 text-sm">{err}</p>}

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
      <label className="block text-xs text-gray-400 mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  );
}
