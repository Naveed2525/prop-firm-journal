import { useState } from 'react';

// A single amber/gold "personal rule" card. Read-only by default; pass
// `editable` (My Plan tab) to show the pencil/trash controls and inline editor.
export function PersonalRuleCard({ rule, compact = false, editable = false, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(rule.text);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');

  const startEdit = () => {
    setText(rule.text);
    setErr('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setText(rule.text);
    setErr('');
    setEditing(false);
  };

  const save = async () => {
    if (!text.trim()) {
      setErr('Rule text cannot be empty.');
      return;
    }
    setErr('');
    setSaving(true);
    try {
      await onSave(text.trim());
      setEditing(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this rule? This cannot be undone.')) return;
    setErr('');
    setDeleting(true);
    try {
      await onDelete();
    } catch (e) {
      setErr(e.message);
      setDeleting(false);
    }
  };

  return (
    <div className="relative rounded-2xl p-5 shadow-md border-2 border-amber-500 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 dark:from-amber-600 dark:via-amber-700 dark:to-amber-800">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 flex-shrink-0 text-amber-950 dark:text-amber-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
          </svg>
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-50 truncate">
            {compact ? 'Reminder — Personal Rule' : 'My Personal Rule'}
          </h2>
        </div>

        {editable && !editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <RuleIconButton onClick={startEdit} label="Edit rule">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </RuleIconButton>
            <RuleIconButton onClick={remove} label="Delete rule" disabled={deleting}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </RuleIconButton>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-base font-bold bg-white/70 dark:bg-black/20 border border-amber-600 dark:border-amber-300 text-amber-950 dark:text-white placeholder-amber-800/50 dark:placeholder-amber-100/50 focus:outline-none focus:ring-2 focus:ring-amber-700 dark:focus:ring-amber-200 resize-none"
            placeholder="Type your rule..."
          />
          {err && <p className="text-xs font-semibold text-red-900 dark:text-red-100">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-amber-950 hover:bg-amber-900 dark:bg-black/40 dark:hover:bg-black/50 disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-white/60 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-50 text-amber-950 dark:text-white text-sm font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight text-amber-950 dark:text-white whitespace-pre-line">
            {rule.text}
          </p>
          {err && <p className="text-xs font-semibold text-red-900 dark:text-red-100 mt-2">{err}</p>}
        </>
      )}
    </div>
  );
}

function RuleIconButton({ onClick, label, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/30 disabled:opacity-50 text-amber-950 dark:text-white transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {children}
      </svg>
    </button>
  );
}

// The manage UI for My Plan tab: renders every rule (editable) plus an
// "Add Personal Rule" button / inline composer.
export function PersonalRulesSection({ rules, onAdd, onUpdate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const startAdd = () => {
    setNewText('');
    setErr('');
    setAdding(true);
  };

  const cancelAdd = () => {
    setAdding(false);
    setErr('');
  };

  const submitAdd = async () => {
    if (!newText.trim()) {
      setErr('Rule text cannot be empty.');
      return;
    }
    setErr('');
    setSaving(true);
    try {
      await onAdd(newText.trim());
      setAdding(false);
      setNewText('');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <PersonalRuleCard
          key={rule.id}
          rule={rule}
          editable
          onSave={(text) => onUpdate(rule.id, text)}
          onDelete={() => onDelete(rule.id)}
        />
      ))}

      {adding ? (
        <div className="bg-white dark:bg-gray-900 border border-dashed border-amber-400 dark:border-amber-700 rounded-2xl p-4 space-y-2">
          <textarea
            autoFocus
            rows={3}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="input resize-none"
            placeholder="e.g. I only trade my A+ setups, no exceptions."
          />
          {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitAdd}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving ? 'Saving…' : 'Save Rule'}
            </button>
            <button
              type="button"
              onClick={cancelAdd}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-amber-400 dark:border-amber-700 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Personal Rule
        </button>
      )}
    </div>
  );
}
