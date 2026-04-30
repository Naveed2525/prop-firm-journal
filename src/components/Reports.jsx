import { useState } from "react";
import { computeWeekReport, computeMonthReport } from "../utils/reportUtils";

const fmt = (n) => {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n >= 0 ? "+$" : "-$") + abs;
};

const pct = (n) => (n * 100).toFixed(1) + "%";

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color || "var(--text, #111)" }}>{value}</div>
    </div>
  );
}

function DayRow({ day, pnl }) {
  const color = pnl >= 0 ? "#16a34a" : "#dc2626";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: "1px solid var(--border, #e5e7eb)", fontSize: 13 }}>
      <span style={{ color: "var(--text2, #6b7280)" }}>{day}</span>
      <span style={{ fontWeight: 600, color }}>{fmt(pnl)}</span>
    </div>
  );
}

function ReportCard({ report, type }) {
  if (!report || report.isEmpty) {
    return (
      <div style={{ textAlign: "center", color: "var(--text3, #9ca3af)", padding: "40px 0", fontSize: 13 }}>
        No trades found for this {type}. Add some trades to see your report.
      </div>
    );
  }

  const pnlColor = report.totalPnL >= 0 ? "#16a34a" : "#dc2626";
  const consistencyLimit = 0.4;
  const consistencyOk = report.consistencyPct < consistencyLimit;

  // Correctly get best and worst day P&L with sign preserved directly from byDay map
  const bestDayPnL = report.bestDay ? report.byDay[report.bestDay] : null;
  const worstDayPnL = report.worstDay ? report.byDay[report.worstDay] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
        <StatBox label="Total P&L" value={fmt(report.totalPnL)} color={pnlColor} />
        <StatBox label="Trading Days" value={report.tradingDays} />
        <StatBox label="Win Rate" value={pct(report.winRate)} color={report.winRate >= 0.5 ? "#16a34a" : "#dc2626"} />
        <StatBox label="Avg Daily P&L" value={fmt(report.avgDaily)} color={report.avgDaily >= 0 ? "#16a34a" : "#dc2626"} />
        <StatBox label="Winners" value={report.wins} color="#16a34a" />
        <StatBox label="Losers" value={report.losses} color="#dc2626" />
      </div>

      {/* Best / Worst / Consistency */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
        <div style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Best Day</div>
          <div style={{ fontSize: 13, color: "var(--text2, #6b7280)", marginBottom: 2 }}>{report.bestDay || "—"}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{fmt(bestDayPnL)}</div>
        </div>
        <div style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Worst Day</div>
          <div style={{ fontSize: 13, color: "var(--text2, #6b7280)", marginBottom: 2 }}>{report.worstDay || "—"}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>{fmt(worstDayPnL)}</div>
        </div>
        <div style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Consistency</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: consistencyOk ? "#16a34a" : "#f59e0b" }}>{pct(report.consistencyPct)}</div>
          <div style={{ fontSize: 11, color: "var(--text3, #9ca3af)", marginTop: 2 }}>Keep under {(consistencyLimit * 100).toFixed(0)}%</div>
        </div>
        {report.topInstrument && (
          <div style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Most Traded</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{report.topInstrument}</div>
          </div>
        )}
        {report.ptProgress !== null && report.ptProgress !== undefined && (
          <div style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Profit Target</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{pct(report.ptProgress)}</div>
            <div style={{ height: 5, background: "#f3f4f6", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: Math.min(100, report.ptProgress * 100) + "%", background: "#16a34a", borderRadius: 3 }} />
            </div>
          </div>
        )}
      </div>

      {/* Daily breakdown */}
      <div style={{ background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--surface2, #f9fafb)", borderBottom: "1px solid var(--border, #e5e7eb)", fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Daily Breakdown
        </div>
        {Object.entries(report.byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, pnl]) => (
          <DayRow key={day} day={day} pnl={pnl} />
        ))}
      </div>
    </div>
  );
}

export default function Reports({ trades }) {
  const [tab, setTab] = useState("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const weekReport = computeWeekReport(trades, weekOffset);
  const monthReport = computeMonthReport(trades, monthOffset, null);

  const tabStyle = (t) => ({
    padding: "7px 18px", borderRadius: 8,
    border: "1px solid var(--border, #e5e7eb)",
    background: tab === t ? "var(--surface, #fff)" : "var(--surface2, #f9fafb)",
    color: tab === t ? "var(--text, #111)" : "var(--text2, #6b7280)",
    cursor: "pointer", fontSize: 13, fontWeight: 600,
    boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
  });

  const navBtn = (onClick, label, disabled) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 12px", borderRadius: 7,
        border: "1px solid var(--border, #e5e7eb)",
        background: "var(--surface2, #f9fafb)",
        color: disabled ? "var(--text3, #9ca3af)" : "var(--text, #111)",
        cursor: disabled ? "default" : "pointer", fontSize: 13, fontWeight: 600
      }}
    >{label}</button>
  );

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2, #6b7280)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Reports
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={tabStyle("week")} onClick={() => setTab("week")}>Weekly</button>
          <button style={tabStyle("month")} onClick={() => setTab("month")}>Monthly</button>
        </div>
      </div>

      {tab === "week" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {navBtn(() => setWeekOffset(w => w - 1), "← Prev", false)}
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              Week {weekReport.weekNumber}, {weekReport.year} · {weekReport.periodLabel}
            </span>
            {navBtn(() => setWeekOffset(w => Math.min(0, w + 1)), "Next →", weekOffset >= 0)}
          </div>
          <ReportCard report={weekReport} type="week" />
        </>
      )}

      {tab === "month" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {navBtn(() => setMonthOffset(m => m - 1), "← Prev", false)}
            <span style={{ fontWeight: 600, fontSize: 14 }}>{monthReport.periodLabel}</span>
            {navBtn(() => setMonthOffset(m => Math.min(0, m + 1)), "Next →", monthOffset >= 0)}
          </div>
          <ReportCard report={monthReport} type="month" />
        </>
      )}
    </div>
  );
}
