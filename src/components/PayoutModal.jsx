import { useState } from 'react';

export default function PayoutModal({ payoutNumber, onSave, onClose, initialData }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState(() => initialData ? {
    date: initialData.date ?? today,
    amountRequested: initialData.amountRequested !== undefined ? String(initialData.amountRequested) : '',
    amountReceived: initialData.amountReceived !== undefined ? String(initialData.amountReceived) : '',
    balanceAfter: initialData.balanceAfter !== undefined ? String(initialData.balanceAfter) : '',
    notes: initialData.notes ?? '',
    status: initialData.status ?? 'pending',
  } : {
    date: today,
    amountRequested: '',
    amountReceived: '',
    balanceAfter: '',
    notes: '',
    status: 'pending',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.date) return setErr('Date is required.');
    if (!form.amountRequested || isNaN(Number(form.amountRequested))) return setErr('Amount requested is required.');
    setErr('');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-t-2xl px-4 pt-4 space-y-4 overflow-y-auto max-h-[90vh]"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{initialData ? `Edit Payout #${payoutNumber}` : `Log Payout #${payoutNumber}`}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount Requested ($)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="500"
            value={form.amountRequested}
            onChange={(e) => set('amountRequested', e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount Received ($)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="450"
            value={form.amountReceived}
            onChange={(e) => set('amountReceived', e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">May differ from requested due to profit split or fees</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Balance After Payout ($)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="1200"
            value={form.balanceAfter}
            onChange={(e) => set('balanceAfter', e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</label>
          <div className="flex gap-2">
            {[
              { value: 'pending', label: 'Pending' },
              { value: 'received', label: 'Received' },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('status', s.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.status === s.value
                    ? s.value === 'pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
          <textarea
            placeholder="e.g., Processing took 3 days, received via ACH"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {err && <p className="text-red-500 text-sm">{err}</p>}

        <div className="flex gap-2 pb-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : initialData ? 'Save Changes' : 'Save Payout'}
          </button>
        </div>
      </div>
    </div>
  );
}
