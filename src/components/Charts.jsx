import { useMemo, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler
);

// Watches the dark class on <html> so charts re-theme when the toggle fires.
function useDarkMode() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const mo = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

// Format a dollar value compactly: $1.2k, -$350, etc.
function fmtD(v) {
  const abs = Math.abs(v);
  const s = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(0);
  return v < 0 ? `-$${s}` : `$${s}`;
}

export default function Charts({ trades }) {
  const isDark = useDarkMode();

  const stats = useMemo(() => {
    if (!trades.length) return null;

    // Group by trading day
    const byDay = {};
    for (const t of trades) {
      const day = t.date.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + t.pnl;
    }
    const days = Object.keys(byDay).sort();
    const daily = days.map((d) => +(byDay[d].toFixed(2)));

    // Running cumulative
    let run = 0;
    const cumul = daily.map((v) => +(( run += v, run ).toFixed(2)));

    const wins   = daily.filter((v) => v > 0).length;
    const losses = daily.filter((v) => v < 0).length;
    const be     = daily.filter((v) => v === 0).length;

    // Short x-axis labels: M/D
    const labels = days.map((d) => {
      const [, m, day] = d.split('-');
      return `${+m}/${+day}`;
    });

    return { days, daily, cumul, wins, losses, be, labels };
  }, [trades]);

  if (!stats) return null;

  const { days, daily, cumul, wins, losses, be, labels } = stats;

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const txt     = isDark ? '#9CA3AF' : '#6B7280';
  const grid    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const zero    = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.20)';
  const ttBg    = isDark ? '#1F2937' : '#ffffff';
  const ttBdr   = isDark ? '#374151' : '#E5E7EB';
  const ttTxt   = isDark ? '#F9FAFB' : '#111827';
  const dntBdr  = isDark ? '#111827' : '#F9FAFB';

  const isUp    = (cumul.at(-1) ?? 0) >= 0;
  const accent  = isUp ? '#22C55E' : '#EF4444';
  const total   = wins + losses + be;
  const winRate = total > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;

  // ── Shared axis / tooltip config ──────────────────────────────────────────
  const tickCfg = { color: txt, font: { size: 10 } };

  const xAxis = {
    grid: { display: false },
    ticks: { ...tickCfg, maxTicksLimit: 8, maxRotation: 0 },
    border: { display: false },
  };

  const yAxis = {
    grid: { color: (ctx) => (ctx.tick.value === 0 ? zero : grid) },
    ticks: { ...tickCfg, callback: fmtD, maxTicksLimit: 5 },
    border: { display: false },
  };

  const ttBase = {
    backgroundColor: ttBg,
    titleColor: ttTxt,
    bodyColor: ttTxt,
    borderColor: ttBdr,
    borderWidth: 1,
    padding: 8,
    displayColors: false,
  };

  const dayTitle = (items) => days[items[0].dataIndex];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* ── Daily P&L bar chart ── */}
      <ChartCard title="Daily P&L">
        <div className="relative h-[180px]">
          <Bar
            data={{
              labels,
              datasets: [{
                data: daily,
                backgroundColor: daily.map((v) =>
                  v >= 0 ? 'rgba(34,197,94,0.80)' : 'rgba(239,68,68,0.80)'
                ),
                borderColor: daily.map((v) =>
                  v >= 0 ? '#16A34A' : '#DC2626'
                ),
                borderWidth: 1,
                borderRadius: 3,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  ...ttBase,
                  callbacks: {
                    title: dayTitle,
                    label: (ctx) => `  P&L: ${fmtD(ctx.parsed.y)}`,
                  },
                },
              },
              scales: { x: xAxis, y: yAxis },
            }}
          />
        </div>
      </ChartCard>

      {/* ── Cumulative P&L line chart ── */}
      <ChartCard title="Cumulative P&L">
        <div className="relative h-[180px]">
          <Line
            data={{
              labels,
              datasets: [{
                data: cumul,
                borderColor: accent,
                backgroundColor: isUp
                  ? 'rgba(34,197,94,0.10)'
                  : 'rgba(239,68,68,0.10)',
                fill: true,
                tension: 0.35,
                pointRadius: days.length <= 20 ? 3 : 0,
                pointHoverRadius: 5,
                pointBackgroundColor: accent,
                borderWidth: 2,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  ...ttBase,
                  callbacks: {
                    title: dayTitle,
                    label: (ctx) => `  Total: ${fmtD(ctx.parsed.y)}`,
                  },
                },
              },
              scales: { x: xAxis, y: yAxis },
            }}
          />
        </div>
      </ChartCard>

      {/* ── Win / Loss donut ── */}
      <ChartCard title={`Win / Loss — ${winRate}% win rate`}>
        <div className="flex items-center gap-5">
          {/* Donut */}
          <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
            <Doughnut
              data={{
                labels: [
                  'Winning Days',
                  'Losing Days',
                  ...(be > 0 ? ['Break Even'] : []),
                ],
                datasets: [{
                  data: [wins, losses, ...(be > 0 ? [be] : [])],
                  backgroundColor: [
                    '#22C55E',
                    '#EF4444',
                    ...(be > 0 ? ['#9CA3AF'] : []),
                  ],
                  borderColor: dntBdr,
                  borderWidth: 3,
                  hoverOffset: 4,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '66%',
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    ...ttBase,
                    callbacks: {
                      label: (ctx) =>
                        ` ${ctx.label}: ${ctx.parsed} day${ctx.parsed !== 1 ? 's' : ''}`,
                    },
                  },
                },
              }}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3 flex-1">
            <DonutLegendRow
              color="#22C55E"
              label="Winning days"
              count={wins}
              textClass="text-green-600 dark:text-green-400"
            />
            <DonutLegendRow
              color="#EF4444"
              label="Losing days"
              count={losses}
              textClass="text-red-600 dark:text-red-400"
            />
            {be > 0 && (
              <DonutLegendRow
                color="#9CA3AF"
                label="Break even"
                count={be}
                textClass="text-gray-500"
              />
            )}
            <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {total} trading day{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function DonutLegendRow({ color, label, count, textClass }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className={`text-base font-bold ${textClass}`}>{count}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
    </div>
  );
}
