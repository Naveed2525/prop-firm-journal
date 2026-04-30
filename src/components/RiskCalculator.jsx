import { useState, useEffect } from "react";

const TICK_VALUES = {
  ES: { tick: 0.25, tickValue: 12.50 },
  MES: { tick: 0.25, tickValue: 1.25 },
  NQ: { tick: 0.25, tickValue: 5.00 },
  MNQ: { tick: 0.25, tickValue: 0.50 },
  CL: { tick: 0.01, tickValue: 10.00 },
  GC: { tick: 0.10, tickValue: 10.00 },
  SI: { tick: 0.005, tickValue: 25.00 },
  ZB: { tick: 0.03125, tickValue: 31.25 },
  ZN: { tick: 0.015625, tickValue: 15.625 },
  RTY: { tick: 0.10, tickValue: 5.00 },
  YM: { tick: 1, tickValue: 5.00 },
  MYM: { tick: 1, tickValue: 0.50 },
};

export default function RiskCalculator({ onClose, accountSize, dllRemaining, maxDrawdownRemaining }) {
  const [symbol, setSymbol] = useState("NQ");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [contracts, setContracts] = useState("1");
  const [calc, setCalc] = useState(null);

  useEffect(() => {
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    const tgt = parseFloat(target);
    const c = parseInt(contracts) || 1;
    const tv = TICK_VALUES[symbol] || { tick: 0.25, tickValue: 5 };

    if (!e || !sl || isNaN(e) || isNaN(sl)) { setCalc(null); return; }

    const riskTicks = Math.abs(e - sl) / tv.tick;
    const dollarRisk = riskTicks * tv.tickValue * c;
    const riskPct = accountSize ? (dollarRisk / accountSize) * 100 : null;

    let dollarTarget = null;
    let rr = null;
    if (tgt && !isNaN(tgt)) {
      const targetTicks = Math.abs(tgt - e) / tv.tick;
      dollarTarget = targetTicks * tv.tickValue * c;
      rr = dollarRisk > 0 ? dollarTarget / dollarRisk : null;
    }

    const maxContractsByDLL = dllRemaining && dollarRisk > 0
      ? Math.floor((dllRemaining / dollarRisk) * c)
      : null;

    const maxContractsByDD = maxDrawdownRemaining && dollarRisk > 0
      ? Math.floor((maxDrawdownRemaining / dollarRisk) * c)
      : null;

    const riskOk = riskPct ? riskPct <= 2 : true;
    const dllOk = dllRemaining ? dollarRisk <= dllRemaining : true;
    const ddOk = maxDrawdownRemaining ? dollarRisk <= maxDrawdownRemaining : true;

    setCalc({ dollarRisk, dollarTarget, rr, riskPct, maxContractsByDLL, maxContractsByDD, riskOk, dllOk, ddOk, tv });
  }, [symbol, entry, stopLoss, target, contracts, accountSize, dllRemaining, maxDrawdownRemaining]);

  const inp = (label, value, onChange, placeholder, type = "number") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ fontSize: 15, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", color: "var(--text, #111)", fontFamily: "inherit", width: "100%", outline: "none" }}
      />
    </div>
  );

  const resultRow = (label, value, color) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border, #f3f4f6)" }}>
      <span style={{ fontSize: 13, color: "var(--text2, #6b7280)" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: color || "var(--text, #111)" }}>{value}</span>
    </div>
  );

  const statusBadge = (ok, okText, failText) => (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: ok ? "#dcfce7" : "#fee2e2", color: ok ? "#15803d" : "#dc2626" }}>
      {ok ? okText : failText}
    </span>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />

      {/* Sheet */}
      <div style={{
        position: "relative", background: "var(--surface, #fff)", borderRadius: "20px 20px 0 0",
        padding: "20px 20px 0", paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
        maxHeight: "90vh", overflowY: "auto", zIndex: 51
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "var(--border, #e5e7eb)", borderRadius: 2, margin: "0 auto 16px" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Risk Calculator</h2>
            <p style={{ fontSize: 12, color: "var(--text2, #6b7280)", margin: "2px 0 0" }}>Check trade before entering</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border, #e5e7eb)", background: "var(--surface2, #f9fafb)", cursor: "pointer", fontSize: 16, color: "var(--text2, #6b7280)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Symbol selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Instrument</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(TICK_VALUES).map(s => (
              <button key={s} onClick={() => setSymbol(s)} style={{
                padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: symbol === s ? "#2563eb" : "var(--surface2, #f9fafb)",
                color: symbol === s ? "#fff" : "var(--text, #111)"
              }}>{s}</button>
            ))}
          </div>
          {TICK_VALUES[symbol] && (
            <p style={{ fontSize: 11, color: "var(--text3, #9ca3af)", marginTop: 6 }}>
              Tick: ${TICK_VALUES[symbol].tickValue} per tick · {TICK_VALUES[symbol].tick} tick size
            </p>
          )}
        </div>

        {/* Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {inp("Entry Price", entry, setEntry, "e.g. 21450")}
          {inp("Stop Loss", stopLoss, setStopLoss, "e.g. 21400")}
          {inp("Target Price", target, setTarget, "e.g. 21550")}
          {inp("Contracts", contracts, setContracts, "1")}
        </div>

        {/* Results */}
        {calc && (
          <div style={{ background: "var(--surface2, #f9fafb)", borderRadius: 12, padding: "4px 16px 4px", marginBottom: 16 }}>
            {resultRow("Dollar Risk", `$${calc.dollarRisk.toLocaleString("en", { maximumFractionDigits: 2 })}`, calc.riskOk ? "#16a34a" : "#dc2626")}
            {calc.dollarTarget !== null && resultRow("Dollar Target", `$${calc.dollarTarget.toLocaleString("en", { maximumFractionDigits: 2 })}`, "#16a34a")}
            {calc.rr !== null && resultRow("Risk : Reward", `1 : ${calc.rr.toFixed(2)}`, calc.rr >= 2 ? "#16a34a" : calc.rr >= 1 ? "#f59e0b" : "#dc2626")}
            {calc.riskPct !== null && resultRow("% of Account Risked", `${calc.riskPct.toFixed(2)}%`, calc.riskOk ? "#16a34a" : "#dc2626")}
            {calc.maxContractsByDLL !== null && resultRow("Max Contracts (DLL)", calc.maxContractsByDLL, calc.dllOk ? "#16a34a" : "#dc2626")}
            {calc.maxContractsByDD !== null && resultRow("Max Contracts (Drawdown)", calc.maxContractsByDD, calc.ddOk ? "#16a34a" : "#dc2626")}
          </div>
        )}

        {/* Status */}
        {calc && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text2, #6b7280)" }}>2% account rule</span>
              {statusBadge(calc.riskOk, "✓ Within limit", "✗ Exceeds 2%")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text2, #6b7280)" }}>Daily loss limit</span>
              {statusBadge(calc.dllOk, "✓ Within DLL", "✗ Exceeds DLL")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text2, #6b7280)" }}>Max drawdown</span>
              {statusBadge(calc.ddOk, "✓ Within drawdown", "✗ Exceeds drawdown")}
            </div>
          </div>
        )}

        {!calc && (
          <div style={{ textAlign: "center", color: "var(--text3, #9ca3af)", padding: "20px 0 24px", fontSize: 13 }}>
            Enter entry and stop loss to see calculations
          </div>
        )}
      </div>
    </div>
  );
}
