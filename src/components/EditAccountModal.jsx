import { useState } from "react";
import { PROP_FIRMS, getRules } from "../data/propFirms";

const CONSISTENCY_OPTIONS = [
  { label: "None (no consistency rule)", value: "" },
  { label: "35%", value: "0.35" },
  { label: "40%", value: "0.40" },
  { label: "50%", value: "0.50" },
  { label: "Custom", value: "custom" },
];

export default function EditAccountModal({ account, onSave, onClose }) {
  const [phase, setPhase] = useState(account.phase || "evaluation");
  const [plan, setPlan] = useState(account.plan || "standard");
  const [label, setLabel] = useState(account.label || "");
  const [startDate, setStartDate] = useState(account.startDate || "");
  const [consistencyChoice, setConsistencyChoice] = useState(() => {
    if (account.consistencyOverride === null || account.consistencyOverride === undefined) return "";
    const val = String(account.consistencyOverride);
    if (["0.35", "0.40", "0.50"].includes(val)) return val;
    return "custom";
  });
  const [customConsistency, setCustomConsistency] = useState(() => {
    if (!account.consistencyOverride) return "";
    const val = String(account.consistencyOverride);
    if (["0.35", "0.40", "0.50"].includes(val)) return "";
    return String(Math.round(account.consistencyOverride * 100));
  });
  const [blown, setBlown] = useState(account.blown ?? false);
  const [passed, setPassed] = useState(account.status === 'passed');
  const [profitTargetOverride, setProfitTargetOverride] = useState(() => {
    if (account.profitTargetOverride != null) return String(account.profitTargetOverride);
    const def = getRules(account.firm, account.size, account.plan);
    return def?.profitTarget ? String(def.profitTarget) : '';
  });
  const [saving, setSaving] = useState(false);

  const firm = PROP_FIRMS[account.firm];
  // Recompute firm default whenever plan changes so the hint stays accurate
  const currentDefaultRules = getRules(account.firm, account.size, plan);
  const defaultProfitTarget = currentDefaultRules?.profitTarget ?? null;

  const handleSave = async () => {
    setSaving(true);
    let consistencyOverride = null;
    if (consistencyChoice === "custom") {
      const pct = parseFloat(customConsistency);
      consistencyOverride = isNaN(pct) ? null : pct / 100;
    } else if (consistencyChoice !== "") {
      consistencyOverride = parseFloat(consistencyChoice);
    }

    const ptNum = parseFloat(profitTargetOverride);
    const profitTargetOverrideVal = phase === 'funded' && !isNaN(ptNum) && ptNum > 0 ? ptNum : null;

    await onSave({
      phase,
      plan,
      label,
      startDate,
      consistencyOverride,
      blown,
      status: phase === 'evaluation' && passed ? 'passed' : null,
      profitTargetOverride: profitTargetOverrideVal,
    });
    setSaving(false);
    onClose();
  };

  const inp = (label, value, onChange, type = "text", placeholder = "") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none" }}
      />
    </div>
  );

  const sel = (labelText, value, onChange, options) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{labelText}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none" }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />

      {/* Sheet */}
      <div style={{
        position: "relative", background: "var(--surface, #fff)",
        borderRadius: "20px 20px 0 0", padding: "20px 20px 0",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
        maxHeight: "90vh", overflowY: "auto", zIndex: 51
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "var(--border, #e5e7eb)", borderRadius: 2, margin: "0 auto 16px" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Edit Account</h2>
            <p style={{ fontSize: 12, color: "var(--text2, #6b7280)", margin: "2px 0 0" }}>{firm?.name} · ${(account.size / 1000).toFixed(0)}K</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", cursor: "pointer", fontSize: 16, color: "var(--text2, #6b7280)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Phase */}
        {sel("Phase", phase, setPhase, [
          { label: "Evaluation / Challenge", value: "evaluation" },
          { label: "Funded", value: "funded" },
        ])}

        {/* Plan */}
        {firm?.plans && sel("Plan", plan, setPlan,
          Object.entries(firm.plans).map(([k, v]) => ({ label: v.name || k, value: k }))
        )}

        {/* Consistency Rule */}
        {sel("Consistency Rule", consistencyChoice, setConsistencyChoice, CONSISTENCY_OPTIONS)}

        {consistencyChoice === "custom" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Custom % (e.g. 45)</label>
            <input
              type="number" value={customConsistency} onChange={e => setCustomConsistency(e.target.value)}
              placeholder="e.g. 45" min="1" max="100"
              style={{ fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none" }}
            />
          </div>
        )}

        {consistencyChoice === "" && (
          <div style={{ fontSize: 12, color: "var(--text3, #9ca3af)", background: "var(--surface2, #f9fafb)", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
            No consistency rule — the consistency gauge will be hidden for this account.
          </div>
        )}

        {/* Profit Target override — funded only */}
        {phase === 'funded' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profit Target ($)</label>
            <input
              type="number"
              value={profitTargetOverride}
              onChange={e => setProfitTargetOverride(e.target.value)}
              placeholder={defaultProfitTarget ? String(defaultProfitTarget) : 'e.g. 3000'}
              min="1"
              style={{ fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none" }}
            />
            {defaultProfitTarget && (
              <p style={{ fontSize: 11, color: "var(--text3, #9ca3af)", margin: "2px 0 0" }}>
                Firm default: ${defaultProfitTarget.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Label */}
        {inp("Account Label (optional)", label, setLabel, "text", "e.g. Main account")}

        {/* Start Date */}
        {inp("Start Date", startDate, setStartDate, "date")}

        {/* Mark as Passed toggle — eval only */}
        {phase === 'evaluation' && (
          <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, border: passed ? "1px solid #6ee7b7" : "1px solid var(--border, #e5e7eb)", background: passed ? "#ecfdf5" : "var(--surface2, #f9fafb)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setPassed(p => !p)}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: passed ? "#059669" : "var(--text, #111)", margin: 0 }}>Mark as Passed</p>
                <p style={{ fontSize: 11, color: passed ? "#10b981" : "var(--text2, #6b7280)", margin: "2px 0 0" }}>
                  {passed ? "Eval marked passed — moved to Passed Eval section" : "Profit target hit and evaluation approved"}
                </p>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: passed ? "#059669" : "#d1d5db", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 2, left: passed ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
              </div>
            </div>
          </div>
        )}

        {/* Mark as Blown toggle */}
        <div style={{ marginBottom: 20, padding: "12px 14px", borderRadius: 10, border: blown ? "1px solid #fca5a5" : "1px solid var(--border, #e5e7eb)", background: blown ? "#fef2f2" : "var(--surface2, #f9fafb)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setBlown(b => !b)}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: blown ? "#dc2626" : "var(--text, #111)", margin: 0 }}>Mark as Blown</p>
              <p style={{ fontSize: 11, color: blown ? "#ef4444" : "var(--text2, #6b7280)", margin: "2px 0 0" }}>
                {blown ? "Account is marked blown — hidden from dashboard" : "Max drawdown breached, account no longer active"}
              </p>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: blown ? "#dc2626" : "#d1d5db", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: blown ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%", padding: "12px", background: saving ? "#9ca3af" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: saving ? "default" : "pointer", marginBottom: 8 }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "12px", background: "transparent", color: "var(--text2, #6b7280)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, fontSize: 15, cursor: "pointer", marginBottom: 8 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
