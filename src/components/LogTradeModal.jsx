import { useState } from 'react';

export default function LogTradeModal({ onSave, onClose }) {
  const [setupConfirmed, setSetupConfirmed] = useState(false);
  const [exitKnown, setExitKnown] = useState(false);
  const [riskConsistent, setRiskConsistent] = useState(false);
  const [followedRules, setFollowedRules] = useState(null); // null | true | false
  const [whyEntered, setWhyEntered] = useState('');
  const [emotion, setEmotion] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (followedRules === null) {
      setErr('Answer "Did I follow my rules?" before saving.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        setupConfirmed,
        exitKnown,
        riskConsistent,
        followedRules,
        whyEntered: whyEntered.trim(),
        emotion: emotion.trim(),
      });
      onClose();
    } catch (ex) {
      setErr(ex.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-end">
      <div
        className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-3xl w-full p-6 overflow-y-auto"
        style={{ maxHeight: '92vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log a Trade Check</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white w-8 h-8 flex items-center justify-center text-2xl leading-none rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
              Before the trade
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 divide-y divide-gray-200 dark:divide-gray-800">
              <CheckRow checked={setupConfirmed} onChange={() => setSetupConfirmed((v) => !v)}>
                Is this one of my setups?
              </CheckRow>
              <CheckRow checked={exitKnown} onChange={() => setExitKnown((v) => !v)}>
                Do I know exactly where I'll exit if wrong?
              </CheckRow>
              <CheckRow checked={riskConsistent} onChange={() => setRiskConsistent((v) => !v)}>
                Am I risking the same amount as always?
              </CheckRow>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              After the trade
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Did I follow my rules?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFollowedRules(true)}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      followedRules === true
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowedRules(false)}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      followedRules === false
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <Field label="Why did I enter?">
                <textarea
                  rows={2}
                  value={whyEntered}
                  onChange={(e) => setWhyEntered(e.target.value)}
                  className="input resize-none"
                  placeholder="e.g. Clean breakout of premarket high with volume"
                />
              </Field>

              <Field label="What emotion did I feel?">
                <input
                  type="text"
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="input"
                  placeholder="e.g. Calm, confident, anxious, FOMO..."
                />
              </Field>
            </div>
          </div>

          {err && <p className="text-red-600 dark:text-red-400 text-sm">{err}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-4 font-semibold text-base transition-colors"
          >
            {saving ? 'Saving…' : 'Save Trade Check'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CheckRow({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-3 py-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 accent-blue-600 rounded flex-shrink-0"
      />
      <span className="text-sm text-gray-700 dark:text-gray-200">{children}</span>
    </label>
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
