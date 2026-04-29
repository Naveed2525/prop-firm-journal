import { useState } from 'react';
import { PROP_FIRMS } from '../data/propFirms';

const FIRM_KEYS = Object.keys(PROP_FIRMS);

export default function AddAccountModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    firm: FIRM_KEYS[0],
    size: PROP_FIRMS[FIRM_KEYS[0]].sizes[0],
    plan: PROP_FIRMS[FIRM_KEYS[0]].plans[0]?.id ?? '',
    phase: 'evaluation',
    label: '',
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const firm = PROP_FIRMS[form.firm];

  const pickFirm = (key) => {
    const f = PROP_FIRMS[key];
    setForm((prev) => ({
      ...prev,
      firm: key,
      size: f.sizes[0],
      plan: f.plans[0]?.id ?? '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await onSave({ ...form, size: Number(form.size) });
      onClose();
    } catch (ex) {
      setErr(ex.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end">
      <div className="bg-gray-900 border-t border-gray-800 rounded-t-3xl w-full p-6 pb-safe overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Add Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center text-2xl leading-none rounded-full hover:bg-gray-800">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Firm */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Prop Firm</p>
            <div className="grid grid-cols-2 gap-2">
              {FIRM_KEYS.map((key) => {
                const f = PROP_FIRMS[key];
                const active = form.firm === key;
                return (
                  <button
                    key={key} type="button" onClick={() => pickFirm(key)}
                    className={`rounded-xl p-3 text-sm font-semibold border-2 transition-all ${
                      active ? 'bg-gray-800' : 'border-gray-800 bg-gray-800/50 hover:border-gray-600'
                    }`}
                    style={{ borderColor: active ? f.color : undefined }}
                  >
                    <span style={{ color: active ? f.color : '#9CA3AF' }}>{f.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Account Size</p>
            <div className="flex flex-wrap gap-2">
              {firm.sizes.map((s) => (
                <Chip key={s} active={form.size === s} onClick={() => setForm((f) => ({ ...f, size: s }))}>
                  ${(s / 1000).toFixed(0)}K
                </Chip>
              ))}
            </div>
          </div>

          {/* Plan (if multiple) */}
          {firm.plans.length > 1 && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Plan</p>
              <div className="flex flex-wrap gap-2">
                {firm.plans.map((p) => (
                  <Chip key={p.id} active={form.plan === p.id} onClick={() => setForm((f) => ({ ...f, plan: p.id }))}>
                    {p.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Phase */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Phase</p>
            <div className="flex gap-2">
              {['evaluation', 'funded'].map((ph) => (
                <Chip key={ph} active={form.phase === ph} onClick={() => setForm((f) => ({ ...f, phase: ph }))}>
                  {ph.charAt(0).toUpperCase() + ph.slice(1)}
                </Chip>
              ))}
            </div>
          </div>

          {/* Label + Start date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5">Label (optional)</label>
              <input
                type="text" placeholder="e.g. Attempt 2"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5">Start Date</label>
              <input
                type="date" value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          {/* Firm notes */}
          {firm.notes && (
            <div className="bg-gray-800/60 rounded-xl px-3 py-2.5 text-xs text-gray-400 leading-relaxed">
              {firm.notes}
            </div>
          )}

          {err && <p className="text-red-400 text-sm">{err}</p>}

          <button
            type="submit" disabled={saving || !form.size}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-4 font-semibold text-base transition-colors"
          >
            {saving ? 'Creating…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold border transition-all ${
        active
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
      }`}
    >
      {children}
    </button>
  );
}
