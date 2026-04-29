import { PROP_FIRMS, getRules } from '../data/propFirms';
import { computeMetrics, getAlerts } from '../utils/metrics';
import { db } from '../lib/storage';
import ProgressBar from './ProgressBar';

export default function AccountCard({ account, onClick }) {
  // Dashboard remounts on every navigation, so reading synchronously is fine.
  const trades = db.getTrades(account.id);

  const firm = PROP_FIRMS[account.firm];
  const rules = getRules(account.firm, account.size, account.plan);
  const m = computeMetrics(trades);
  const alerts = getAlerts(m, rules);

  const hasDanger = alerts.some((a) => a.level === 'danger');
  const hasWarning = alerts.some((a) => a.level === 'warning');
  const hasSuccess = alerts.some((a) => a.level === 'success');

  const statusDot = hasDanger ? 'bg-red-500' : hasWarning ? 'bg-amber-500' : hasSuccess ? 'bg-green-400' : 'bg-gray-600';
  const pnlColor = m.totalPnL >= 0 ? 'text-green-400' : 'text-red-400';
  const ddPct = rules ? m.currentDrawdown / rules.maxDrawdown : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-4 transition-colors active:opacity-80"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: firm?.color }}>{firm?.name}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-200 text-sm font-medium">${(account.size / 1000).toFixed(0)}K</span>
            {account.label && <span className="text-gray-500 text-xs">({account.label})</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">
            {account.phase} · {rules?.planName ?? 'Standard'} · {(rules?.split * 100).toFixed(0)}% split
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${account.phase === 'funded' ? 'bg-green-950 text-green-400' : 'bg-blue-950 text-blue-400'}`}>
            {account.phase === 'funded' ? 'Funded' : 'Eval'}
          </span>
        </div>
      </div>

      {/* P&L + target */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className={`text-2xl font-bold ${pnlColor}`}>
          {m.totalPnL >= 0 ? '+' : ''}${m.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        {rules && (
          <span className="text-gray-500 text-sm">/ ${rules.profitTarget.toLocaleString()} target</span>
        )}
      </div>
      {rules && (
        <ProgressBar
          value={Math.max(m.totalPnL, 0)} max={rules.profitTarget}
          baseColor="bg-green-500" warnAt={999} dangerAt={999}
          height="h-1.5"
        />
      )}

      {/* Metrics row */}
      {rules && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <MiniMetric
            label="Drawdown"
            value={`$${m.currentDrawdown.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            pct={ddPct}
            warn={0.75} danger={0.90}
          />
          <MiniMetric
            label="Today"
            value={`${m.todayPnL >= 0 ? '+' : ''}$${Math.abs(m.todayPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            color={m.todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}
            pct={rules.hasDLL && m.todayPnL < 0 ? Math.abs(m.todayPnL) / rules.dailyLossLimit : 0}
            warn={0.75} danger={0.90}
          />
          <MiniMetric
            label={`Consistency`}
            value={`${(m.consistencyPct * 100).toFixed(0)}%`}
            sub={`/ ${(rules.consistencyRule * 100).toFixed(0)}%`}
            color={m.consistencyPct > rules.consistencyRule ? 'text-red-400' : 'text-gray-200'}
            pct={m.consistencyPct / rules.consistencyRule}
            warn={0.85} danger={1.0}
          />
        </div>
      )}

      {/* Alert strip */}
      {alerts.length > 0 && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${hasDanger ? 'bg-red-950/60 text-red-300' : hasWarning ? 'bg-amber-950/60 text-amber-300' : 'bg-green-950/60 text-green-300'}`}>
          {alerts[0].msg}
        </div>
      )}
    </button>
  );
}

function MiniMetric({ label, value, sub, color = 'text-gray-200', pct = 0, warn, danger }) {
  const barColor = pct >= danger ? 'bg-red-500' : pct >= warn ? 'bg-amber-500' : 'bg-gray-600';
  const clamped = Math.min(pct, 1);
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>
        {value}{sub && <span className="text-gray-500 text-xs ml-0.5">{sub}</span>}
      </p>
      <div className="h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${clamped * 100}%` }} />
      </div>
    </div>
  );
}
