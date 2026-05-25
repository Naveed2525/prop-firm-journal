import { useState } from "react";
import { getRules, getRulesFromFirms } from "../data/propFirms";
import { useFirms } from "../context/FirmsContext";
import CostSection from "./CostSection";
import { initCosts, serializeCosts } from "../utils/costs";

const FIRM_PAYOUT_DEFAULTS = {
  topstep:  { minWinningDays: 5, minProfitPerDay: 150, maxPayoutPct: 50, maxPayoutCap: 5000 },
  mff:      { minWinningDays: 5, minProfitPerDay: 150, maxPayoutPct: 50, maxPayoutCap: 0 },
  tradeify: { minWinningDays: 5, minProfitPerDay: 0,   maxPayoutPct: 50, maxPayoutCap: 0 },
  lucid:    { minWinningDays: 5, minProfitPerDay: 100, maxPayoutPct: 50, maxPayoutCap: 0 },
};

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
  const { firms } = useFirms();
  const firmPayoutDefs = FIRM_PAYOUT_DEFAULTS[account.firm] ?? { minWinningDays: 5, minProfitPerDay: 0, maxPayoutPct: 50, maxPayoutCap: 0 };
  const existingPR = account.payoutRules ?? {};
  const [minWinningDays, setMinWinningDays] = useState(String(existingPR.minWinningDays ?? firmPayoutDefs.minWinningDays));
  const [minProfitPerDay, setMinProfitPerDay] = useState(String(existingPR.minProfitPerDay ?? firmPayoutDefs.minProfitPerDay));
  const [maxPayoutPct, setMaxPayoutPct] = useState(String(existingPR.maxPayoutPct ?? firmPayoutDefs.maxPayoutPct));
  const [maxPayoutCap, setMaxPayoutCap] = useState(String(existingPR.maxPayoutCap ?? firmPayoutDefs.maxPayoutCap));
  const [purchaseDate, setPurchaseDate] = useState(() => account.purchaseDateTime?.slice(0, 10) ?? '');
  const [purchaseTime, setPurchaseTime] = useState(() => account.purchaseDateTime?.slice(11, 16) ?? '');
  const [costs, setCosts] = useState(() => initCosts(account.costs));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const firm = firms[account.firm];
  const currentDefaultRules = getRulesFromFirms(firms, account.firm, account.size, plan);
  const defaultProfitTarget = currentDefaultRules?.profitTarget ?? null;

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let consistencyOverride = null;
      if (consistencyChoice === "custom") {
        const pct = parseFloat(customConsistency);
        consistencyOverride = isNaN(pct) ? null : pct / 100;
      } else if (consistencyChoice !== "") {
        consistencyOverride = parseFloat(consistencyChoice);
      }

      const ptNum = parseFloat(profitTargetOverride);
      const profitTargetOverrideVal = phase === 'funded' && !isNaN(ptNum) && ptNum > 0 ? ptNum : null;

      const payoutRules = phase === 'funded' ? {
        minWinningDays: parseInt(minWinningDays) || 5,
        minProfitPerDay: parseFloat(minProfitPerDay) || 0,
        maxPayoutPct: parseFloat(maxPayoutPct) || 50,
        maxPayoutCap: parseFloat(maxPayoutCap) || 0,
      } : null;

      const purchaseDateTime = phase === 'evaluation' && purchaseDate
        ? `${purchaseDate}T${purchaseTime || '00:00'}`
        : null;

      const now = new Date().toISOString();
      await onSave({
        phase,
        plan,
        label,
        startDate,
        consistencyOverride,
        blown,
        blownAt: blown && !account.blown ? now : undefined,
        status: phase === 'evaluation' && passed ? 'passed' : null,
        passedAt: phase === 'evaluation' && passed && account.status !== 'passed' ? now : undefined,
        profitTargetOverride: profitTargetOverrideVal,
        payoutRules,
        purchaseDateTime,
        costs: serializeCosts(costs),
        // Signal to the parent to create a funded account only when toggling passed on for the first time
        _createFundedAccount: phase === 'evaluation' && passed && account.status !== 'passed',
      });
      setSaving(false);
      onClose();
    } catch (e) {
      setSaveError(e?.message ?? 'Something went wrong. Please try again.');
      setSaving(false);
    }
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

        {/* Payout Rules — funded only */}
        {phase === 'funded' && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--border, #e5e7eb)" }}>
              Payout Rules
            </div>
            {inp("Min. Winning Days Required", minWinningDays, setMinWinningDays, "number", "5")}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Min. Profit Per Winning Day ($)</label>
              <input
                type="number" value={minProfitPerDay} onChange={e => setMinProfitPerDay(e.target.value)}
                placeholder="0" min="0"
                style={{ fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none" }}
              />
              <p style={{ fontSize: 11, color: "var(--text3, #9ca3af)", margin: "2px 0 0" }}>0 = any profitable day counts</p>
            </div>
            {inp("Max. Payout %", maxPayoutPct, setMaxPayoutPct, "number", "50")}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Max. Payout $ Cap</label>
              <input
                type="number" value={maxPayoutCap} onChange={e => setMaxPayoutCap(e.target.value)}
                placeholder="0" min="0"
                style={{ fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none" }}
              />
              <p style={{ fontSize: 11, color: "var(--text3, #9ca3af)", margin: "2px 0 0" }}>0 = no cap</p>
            </div>
          </>
        )}

        {/* Label */}
        {inp("Account Label (optional)", label, setLabel, "text", "e.g. Main account")}

        {/* Start Date */}
        {inp("Start Date", startDate, setStartDate, "date")}

        {/* Purchase Date & Time — eval only */}
        {phase === 'evaluation' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Purchase Date & Time</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--text3, #9ca3af)", display: "block", marginBottom: 3 }}>Date</label>
                <input
                  type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                  style={{ fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--text3, #9ca3af)", display: "block", marginBottom: 3 }}>Time</label>
                <input
                  type="time" value={purchaseTime} onChange={e => setPurchaseTime(e.target.value)}
                  style={{ fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mark as Passed toggle — eval only */}
        {phase === 'evaluation' && (
          <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, border: passed ? "1px solid #6ee7b7" : "1px solid var(--border, #e5e7eb)", background: passed ? "#ecfdf5" : "var(--surface2, #f9fafb)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setPassed(p => !p)}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: passed ? "#059669" : "var(--text, #111)", margin: 0 }}>Mark as Passed</p>
                <p style={{ fontSize: 11, color: passed ? "#10b981" : "var(--text2, #6b7280)", margin: "2px 0 0" }}>
                  {passed
                    ? account.status === 'passed'
                      ? "Already passed — saving won't create another funded account"
                      : "Saving will create a funded account and navigate there"
                    : "Profit target hit and evaluation approved"}
                </p>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: passed ? "#059669" : "#d1d5db", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 2, left: passed ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
              </div>
            </div>
          </div>
        )}

        {/* Create Funded Account — shown when eval is already passed */}
        {phase === 'evaluation' && account.status === 'passed' && (
          <button
            onClick={async () => {
              setSaving(true);
              setSaveError('');
              try {
                await onSave({ _createFundedAccount: true });
              } catch (e) {
                setSaveError(e?.message ?? 'Something went wrong. Please try again.');
                setSaving(false);
              }
            }}
            disabled={saving}
            style={{ width: "100%", padding: "11px", background: saving ? "#9ca3af" : "#059669", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer", marginBottom: 12 }}
          >
            {saving ? "Creating funded account…" : "Create Funded Account"}
          </button>
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

        {/* Costs */}
        <div style={{ marginBottom: 16 }}>
          <CostSection costs={costs} onChange={setCosts} />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%", padding: "12px", background: saving ? "#9ca3af" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: saving ? "default" : "pointer", marginBottom: 8 }}
        >
          {saving
            ? (passed && account.status !== 'passed' ? "Creating funded account…" : "Saving…")
            : "Save Changes"}
        </button>
        {saveError && (
          <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8, textAlign: "center" }}>{saveError}</p>
        )}
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
