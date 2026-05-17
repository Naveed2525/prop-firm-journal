import { useState } from 'react';
import { BUILTIN_FIRM_KEYS } from '../data/propFirms';
import { useFirms } from '../context/FirmsContext';

export default function ManageFirms({ onClose }) {
  const { firms, customFirms, addFirm, deleteFirm, updateFirm } = useFirms();
  const [expanded, setExpanded] = useState(null);
  const [showAddFirm, setShowAddFirm] = useState(false);
  const [addSizeFor, setAddSizeFor] = useState(null);
  const [sizeInput, setSizeInput] = useState('');
  const [addPlanFor, setAddPlanFor] = useState(null);
  const [planInput, setPlanInput] = useState({ name: '', hasDLL: true });
  const [newFirm, setNewFirm] = useState({ name: '', shortName: '', color: '#6366F1' });
  const [savingKey, setSavingKey] = useState(null);
  const [savingFirm, setSavingFirm] = useState(false);
  const [err, setErr] = useState('');
  const [firmErr, setFirmErr] = useState('');

  const customKeys = customFirms.map((f) => f.key);

  const handleToggle = (key) => {
    setExpanded((prev) => (prev === key ? null : key));
    setAddSizeFor(null);
    setAddPlanFor(null);
    setSizeInput('');
    setPlanInput({ name: '', hasDLL: true });
    setErr('');
  };

  const handleAddSize = async (firmKey) => {
    const raw = sizeInput.trim();
    if (!raw) return;
    const num = parseFloat(raw);
    if (isNaN(num) || num <= 0) { setErr('Enter a valid size (e.g. 25 for $25K)'); return; }
    const size = num < 1000 ? Math.round(num * 1000) : Math.round(num);
    const currentSizes = firms[firmKey]?.sizes ?? [];
    if (currentSizes.includes(size)) { setErr('This size already exists'); return; }
    setErr('');
    setSavingKey(firmKey);
    try {
      await updateFirm(firmKey, { sizes: [...currentSizes, size].sort((a, b) => a - b) });
      setAddSizeFor(null);
      setSizeInput('');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemoveSize = async (firmKey, size) => {
    const currentSizes = firms[firmKey]?.sizes ?? [];
    if (currentSizes.length <= 1) { setErr("Can't remove the only size"); return; }
    setErr('');
    setSavingKey(firmKey);
    try {
      await updateFirm(firmKey, { sizes: currentSizes.filter((s) => s !== size) });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleAddPlan = async (firmKey) => {
    if (!planInput.name.trim()) { setErr('Enter a plan name'); return; }
    const planId = planInput.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const currentPlans = firms[firmKey]?.plans ?? [];
    if (currentPlans.some((p) => p.id === planId)) { setErr('A plan with this name already exists'); return; }
    setErr('');
    setSavingKey(firmKey);
    try {
      await updateFirm(firmKey, {
        plans: [...currentPlans, { id: planId, name: planInput.name.trim(), hasDLL: planInput.hasDLL }],
      });
      setAddPlanFor(null);
      setPlanInput({ name: '', hasDLL: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemovePlan = async (firmKey, planId) => {
    const currentPlans = firms[firmKey]?.plans ?? [];
    if (currentPlans.length <= 1) { setErr("Can't remove the only plan"); return; }
    setErr('');
    setSavingKey(firmKey);
    try {
      await updateFirm(firmKey, { plans: currentPlans.filter((p) => p.id !== planId) });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeleteFirm = async (key) => {
    if (!window.confirm(`Delete "${firms[key]?.name}"? This cannot be undone.`)) return;
    setSavingKey(key);
    try {
      await deleteFirm(key);
      if (expanded === key) setExpanded(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleAddFirm = async () => {
    if (!newFirm.name.trim() || !newFirm.shortName.trim()) {
      setFirmErr('Firm name and short code are required');
      return;
    }
    setFirmErr('');
    setSavingFirm(true);
    try {
      await addFirm({ ...newFirm });
      setShowAddFirm(false);
      setNewFirm({ name: '', shortName: '', color: '#6366F1' });
    } catch (e) {
      setFirmErr(e.message);
    } finally {
      setSavingFirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-end">
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-3xl w-full flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Firms</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-safe">
          {err && (
            <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl">
              {err}
            </div>
          )}

          {/* Built-in firms */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Built-in Firms
            </p>
            <div className="space-y-2">
              {BUILTIN_FIRM_KEYS.map((key) => (
                <FirmCard
                  key={key}
                  firmKey={key}
                  firm={firms[key]}
                  isBuiltin
                  expanded={expanded === key}
                  onToggle={() => handleToggle(key)}
                  addSizeFor={addSizeFor}
                  setAddSizeFor={setAddSizeFor}
                  sizeInput={sizeInput}
                  setSizeInput={setSizeInput}
                  addPlanFor={addPlanFor}
                  setAddPlanFor={setAddPlanFor}
                  planInput={planInput}
                  setPlanInput={setPlanInput}
                  onAddSize={handleAddSize}
                  onRemoveSize={handleRemoveSize}
                  onAddPlan={handleAddPlan}
                  onRemovePlan={handleRemovePlan}
                  saving={savingKey === key}
                  setErr={setErr}
                />
              ))}
            </div>
          </div>

          {/* Custom firms */}
          {customKeys.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                Custom Firms
              </p>
              <div className="space-y-2">
                {customKeys.map((key) => (
                  <FirmCard
                    key={key}
                    firmKey={key}
                    firm={firms[key]}
                    isBuiltin={false}
                    expanded={expanded === key}
                    onToggle={() => handleToggle(key)}
                    onDelete={() => handleDeleteFirm(key)}
                    addSizeFor={addSizeFor}
                    setAddSizeFor={setAddSizeFor}
                    sizeInput={sizeInput}
                    setSizeInput={setSizeInput}
                    addPlanFor={addPlanFor}
                    setAddPlanFor={setAddPlanFor}
                    planInput={planInput}
                    setPlanInput={setPlanInput}
                    onAddSize={handleAddSize}
                    onRemoveSize={handleRemoveSize}
                    onAddPlan={handleAddPlan}
                    onRemovePlan={handleRemovePlan}
                    saving={savingKey === key}
                    setErr={setErr}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add firm form / button */}
          {showAddFirm ? (
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 space-y-4 border border-gray-100 dark:border-gray-800">
              <p className="text-sm font-bold text-gray-900 dark:text-white">New Firm</p>
              {firmErr && <p className="text-red-600 dark:text-red-400 text-xs">{firmErr}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Trader"
                    value={newFirm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const auto = name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 4);
                      setNewFirm((f) => ({ ...f, name, shortName: f.shortName || auto }));
                    }}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">Code (max 4)</label>
                  <input
                    type="text"
                    placeholder="e.g. APX"
                    maxLength={4}
                    value={newFirm.shortName}
                    onChange={(e) => setNewFirm((f) => ({ ...f, shortName: e.target.value.toUpperCase() }))}
                    className="input text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newFirm.color}
                    onChange={(e) => setNewFirm((f) => ({ ...f, color: e.target.value }))}
                    className="w-12 h-10 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-transparent"
                  />
                  <div
                    className="flex-1 h-10 rounded-xl flex items-center px-4 text-sm font-bold border-2"
                    style={{ backgroundColor: newFirm.color + '18', color: newFirm.color, borderColor: newFirm.color }}
                  >
                    {newFirm.name || 'Preview'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAddFirm}
                  disabled={savingFirm}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  {savingFirm ? 'Adding…' : 'Add Firm'}
                </button>
                <button
                  onClick={() => { setShowAddFirm(false); setFirmErr(''); }}
                  className="px-5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddFirm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Custom Firm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FirmCard({
  firmKey, firm, isBuiltin, expanded, onToggle, onDelete,
  addSizeFor, setAddSizeFor, sizeInput, setSizeInput,
  addPlanFor, setAddPlanFor, planInput, setPlanInput,
  onAddSize, onRemoveSize, onAddPlan, onRemovePlan,
  saving, setErr,
}) {
  const sizes = firm?.sizes ?? [];
  const plans = firm?.plans ?? [];

  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: firm?.color }} />
        <span className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{firm?.name}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{firm?.shortName}</span>
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          {isBuiltin ? (
            <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Sizes */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Account Sizes</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <div key={s} className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">${(s / 1000).toFixed(0)}K</span>
                  <button
                    onClick={() => { setErr(''); onRemoveSize(firmKey, s); }}
                    disabled={sizes.length <= 1 || saving}
                    className="ml-1 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={sizes.length <= 1 ? "Can't remove the only size" : "Remove size"}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {addSizeFor === firmKey ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="25"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); onAddSize(firmKey); }
                      if (e.key === 'Escape') { setAddSizeFor(null); setSizeInput(''); setErr(''); }
                    }}
                    className="input w-20 text-sm py-1.5 text-center"
                    autoFocus
                    min="1"
                  />
                  <span className="text-xs text-gray-400">K</span>
                  <button
                    onClick={() => onAddSize(firmKey)}
                    disabled={saving || !sizeInput.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    {saving ? '…' : 'Add'}
                  </button>
                  <button
                    onClick={() => { setAddSizeFor(null); setSizeInput(''); setErr(''); }}
                    className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddSizeFor(firmKey); setAddPlanFor(null); setSizeInput(''); setErr(''); }}
                  className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Size
                </button>
              )}
            </div>
          </div>

          {/* Plans */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Plans</p>
            <div className="flex flex-wrap gap-2">
              {plans.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{p.name}</span>
                  {!p.hasDLL && <span className="text-xs text-gray-400 dark:text-gray-500">no DLL</span>}
                  <button
                    onClick={() => { setErr(''); onRemovePlan(firmKey, p.id); }}
                    disabled={plans.length <= 1 || saving}
                    className="ml-0.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={plans.length <= 1 ? "Can't remove the only plan" : "Remove plan"}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {addPlanFor === firmKey ? (
                <div className="w-full mt-1 space-y-2.5">
                  <input
                    type="text"
                    placeholder="Plan name (e.g. Accelerated)"
                    value={planInput.name}
                    onChange={(e) => setPlanInput((p) => ({ ...p, name: e.target.value }))}
                    className="input text-sm"
                    autoFocus
                  />
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={planInput.hasDLL}
                      onChange={(e) => setPlanInput((p) => ({ ...p, hasDLL: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Has Daily Loss Limit</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setErr(''); onAddPlan(firmKey); }}
                      disabled={saving || !planInput.name.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      {saving ? 'Adding…' : 'Add Plan'}
                    </button>
                    <button
                      onClick={() => { setAddPlanFor(null); setPlanInput({ name: '', hasDLL: true }); setErr(''); }}
                      className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAddPlanFor(firmKey); setAddSizeFor(null); setPlanInput({ name: '', hasDLL: true }); setErr(''); }}
                  className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
