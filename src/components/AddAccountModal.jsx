import { useState } from 'react';
import { PROP_FIRMS, getRules } from '../data/propFirms';

const FIRM_KEYS = Object.keys(PROP_FIRMS);
const CONSISTENCY_OPTIONS = [
  { key: 'default', label: 'Firm Default' },
  { key: 'none',    label: 'None' },
  { key: '35',      label: '35%' },
  { key: '40',      label: '40%' },
  { key: '50',      label: '50%' },
  { key: 'custom',  label: 'Custom' },
];

export default function AddAccountModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    firm: FIRM_KEYS[0],
    size: PROP_FIRMS[FIRM_KEYS[0]].sizes[0],
    plan: PROP_FIRMS[FIRM_KEYS[0]].plans[0]?.id ?? '',
    phase: 'evaluation',
    label: '',
    startDate: new Date().toISOString().slice(0, 10),
    consistencyKey: 'default',
    consistencyCustom: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const firm = PROP_FIRMS[form.firm];
  const firmRules = getRules(form.firm, Number(form.size), form.plan);
  const firmDefaultPct = firmRules ? (firmRules.consistencyRule * 100).toFixed(0) : '40';

  const pickFirm = (key) => {
    const f = PROP_FIRMS[key];
    setForm((prev) => ({
      ...prev,
      firm: key,
      size: f.sizes[0],
      plan: f.plans[0]?.id ?? '',
      consistencyKey: 'default',
      consistencyCustom: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    // Validate custom value
    if (form.consistencyKey === 'custom') {
      const v = parseFloat(form.consistencyCustom);
      if (isNaN(v) || v <= 0 || v > 100) {
        setErr('Enter a custom consistency % between 1 and 100.');
        return;
      }
    }

    setSaving(true);
    try {
      // Resolve consistencyOverride to null | 0 | decimal
      let consistencyOverride = null;
      if (form.consistencyKey === 'none') {
        consistencyOverride = 0;
      } else if (form.consistencyKey === 'custom') {
        consistencyOverride = parseFloat(form.consistencyCustom) / 100;
      } else if (form.consistencyKey !== 'default') {
        consistencyOverride = parseFloat(form.consistencyKey) / 100;
      }

      const { consistencyKey, consistencyCustom, ...rest } = form;
      await onSave({ ...rest, size: Number(rest.size), consistencyOverride });
      onClose();
    } catch (ex) {
      setErr(ex.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-end">
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-3xl w-full p-6 pb-safe overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white w-8 h-8 flex items-center justify-center text-2xl leading-none rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Firm */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Prop Firm</p>
            <div className="grid grid-cols-2 gap-2">
              {FIRM_KEYS.map((key) => {
                const f = PROP_FIRMS[key];
                const active = form.firm === key;
                return (
                  <button
                    key={key} type="button" onClick={() => pickFirm(key)}
                    className={`rounded-xl p-3 text-sm font-semibold border-2 transition-all ${
                      active
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={{ borderColor: active ? f.color : undefined }}
                  >
                    <span style={{ color: active ? f.color : undefined }}
                      className={active ? '' : 'text-gray-500 dark:text-gray-400'}>
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Account Size</p>
            <div className="flex flex-wrap gap-2">
              {firm.sizes.map((s) => (
                <Chip key={s} active={form.size === s} onClick={() => setForm((f) => ({ ...f, size: s }))}>
                  ${(s / 1000).toFixed(0)}K
                </Chip>
              ))}
            </div>
          </div>

          {/* Plan */}
          {firm.plans.length > 1 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Plan</p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Phase</p>
            <div className="flex gap-2">
              {['evaluation', 'funded'].map((ph) => (
                <Chip key={ph} active={form.phase === ph} onClick={() => setForm((f) => ({ ...f, phase: ph }))}>
                  {ph.charAt(0).toUpperCase() + ph.slice(1)}
                </Chip>
              ))}
            </div>
          </div>

          {/* Consistency Rule Override */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
              Consistency Rule
              <span className="font-normal ml-1 text-gray-400 dark:text-gray-500">
                (firm default: {firmDefaultPct}%)
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {CONSISTENCY_OPTIONS.map(({ key, label }) => (
                <Chip
                  key={key}
                  active={form.consistencyKey === key}
                  onClick={() => setForm((f) => ({ ...f, consistencyKey: key }))}
                >
                  {label}
                </Chip>
              ))}
            </div>
            {form.consistencyKey === 'custom' && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={form.consistencyCustom}
                  onChange={(e) => setForm((f) => ({ ...f, consistencyCustom: e.target.value }))}
                  min="1" max="100" step="1"
                  className="input w-24 text-center"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
              </div>
            )}
          </div>

          {/* Label + start date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">Label (optional)</label>
              <input
                type="text" placeholder="e.g. Attempt 2"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">Start Date</label>
              <input
                type="date" value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          {/* Firm notes */}
          {firm.notes && (
            <div className="bg-gray-100 dark:bg-gray-800/60 rounded-xl px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {firm.notes}
            </div>
          )}

          {err && <p className="text-red-600 dark:text-red-400 text-sm">{err}</p>}

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
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {children}
    </button>
  );
}
