import { useState } from "react";
import { computeWeekReport, computeMonthReport } from "../utils/reportUtils";

const fmt = (n) => (n >= 0 ? "+" : "") + "$" + Math.abs(n).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => (n * 100).toFixed(1) + "%";

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

function ReportCard({ report, type }) {
  if (report.isEmpty) {
    return <div style={{ textAlign: "center", color: "var(--text3)", padding: "40px 0", fontSize: 13 }}>No trades found for this {type}.</div>;
  }

  const pnlColor = report.totalPnL >= 0 ? "var(--green)" : "var(--red)";
  const consistencyOk = report.consistencyPct < (type === "week" ? 0.4 : 0.4);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 16 }}>
        <StatBox label="Total P&L" value={fmt(report.totalPnL)} color={pnlColor} />
        <StatBox label="Trading Days" value={report.tradingDays} />
        <StatBox label="Win Rate" value={pct(report.winRate)} color={report.winRate >= 0.5 ? "var(--green)" : "var(--red)"} />
        <StatBox label="Avg Daily P&L" value={fmt(report.avgDaily)} color={report.avgDaily >= 0 ? "var(--green)" : "var(--red)"} />
        <StatBox label="Winners" value={report.wins} color="var(--green)" />
        <StatBox label="Losers" value={report.losses} color="var(--red)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: 16 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Best Day</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>{report.bestDay || "—"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{report.bestDayPnL !== undefined ? fmt(report.bestDayPnL) : report.bestWeek ? fmt(report.bestWeek.pnl) : "—"}</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Worst Day</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--red)" }}>{report.worstDay || "—"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--red)" }}>{report.worstDayPnL !== undefined ? fmt(report.worstDayPnL) : report.worstWeek ? fmt(report.worstWeek.pnl) : "—"}</div>
        </div>
        {report.topInstrument && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Most Traded</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{report.topInstrument}</div>
          </div>
        )}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Consistency Rule</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: consistencyOk ? "var(--green)" : "var(--amber)" }}>{pct(report.consistencyPct)}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Biggest day of total profit. Keep under 40%.</div>
        </div>
        {report.ptProgress !== null && report.ptProgress !== undefined && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Profit Target Progress</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{pct(report.ptProgress)}</div>
            <div style={{ height: 5, background: "var(--surface2)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: Math.min(100, report.ptProgress * 100) + "%", background: "var(--green)", borderRadius: 3 }} />
            </div>
          </div>
        )}
      </div>

      {/* Daily breakdown */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--surface2)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Daily Breakdown</div>
        {Object.entries(report.byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, pnl]) => (
          <div key={day} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>{day}</span>
            <span style={{ fontWeight: 600, color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(pnl)}</span>
          </div>
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
    padding: "7px 18px", borderRadius: 8, border: "1px solid var(--border)",
    background: tab === t ? "var(--surface)" : "var(--surface2)",
    color: tab === t ? "var(--text)" : "var(--text2)",
    cursor: "pointer", fontSize: 13, fontWeight: 600,
    boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
  });

  const navBtn = (onClick, label) => (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{label}</button>
  );

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reports</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={tabStyle("week")} onClick={() => setTab("week")}>Weekly</button>
          <button style={tabStyle("month")} onClick={() => setTab("month")}>Monthly</button>
        </div>
      </div>

      {tab === "week" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            {navBtn(() => setWeekOffset(w => w - 1), "← Prev")}
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              Week {weekReport.weekNumber}, {weekReport.year} &nbsp;·&nbsp; {weekReport.periodLabel}
            </span>
            {navBtn(() => setWeekOffset(w => Math.min(0, w + 1)), "Next →")}
          </div>
          <ReportCard report={weekReport} type="week" />
        </>
      )}

      {tab === "month" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            {navBtn(() => setMonthOffset(m => m - 1), "← Prev")}
            <span style={{ fontWeight: 600, fontSize: 15 }}>{monthReport.periodLabel}</span>
            {navBtn(() => setMonthOffset(m => Math.min(0, m + 1)), "Next →")}
          </div>
          <ReportCard report={monthReport} type="month" />
        </>
      )}
    </div>
  );
}
