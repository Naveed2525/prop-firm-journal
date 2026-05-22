import { getRulesFromFirms } from '../data/propFirms';
import { useFirms } from '../context/FirmsContext';
import { computeMetrics, getAlerts } from '../utils/metrics';
import { useTrades, usePayouts } from '../hooks/useData';
import { computeTotalCost } from '../utils/costs';
import ProgressBar from './ProgressBar';

function applyConsistencyOverride(rules, override) {
  if (!rules || override == null) return rules;
  return { ...rules, consistencyRule: override === 0 ? null : override };
}

export default function AccountCard({ account, onClick }) {
  const { firms } = useFirms();
  const { trades, loading } = useTrades(account.id);
  const { payouts } = usePayouts(account.id);

  const firm  = firms[account.firm];
  const rules = getRulesFromFirms(firms, account.firm, account.size, account.plan);
  const effectiveRules = applyConsistencyOverride(rules, account.consistencyOverride);
  const m = computeMetrics(trades);
  const alerts = getAlerts(m, effectiveRules);

  const hasDanger  = alerts.some((a) => a.level === 'danger');
  const hasWarning = alerts.some((a) => a.level === 'warning');
  const hasSuccess = alerts.some((a) => a.level === 'success');

  const statusDot = hasDanger ? 'bg-red-500' : hasWarning ? 'bg-amber-500' : hasSuccess ? 'bg-green-400' : 'bg-gray-400 dark:bg-gray-600';
  const pnlColor  = m.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const ddPct     = effectiveRules ? m.currentDrawdown / effectiveRules.maxDrawdown : 0;
  const consistencyEnabled = effectiveRules?.consistencyRule != null;

  const isBlown = account.blown === true;
  const totalCost = computeTotalCost(account.costs);
  const totalPaidOut = payouts
    .filter((p) => p.status?.toLowerCase() === 'received')
    .reduce((s, p) => s + (Number(p.amountReceived) || 0), 0);

  if (loading) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left rounded-2xl p-4 ${
          isBlown
            ? 'bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 opacity-70'
            : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: firm?.color }}>{firm?.name}</span>
              <span className="text-gray-300 dark:text-gray-500 text-sm">·</span>
              <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                ${(account.size / 1000).toFixed(0)}K
              </span>
              {account.label && (
                <span className="text-gray-400 dark:text-gray-500 text-xs">({account.label})</span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
              {account.phase} · {effectiveRules?.planName ?? 'Standard'} · {(effectiveRules?.split * 100).toFixed(0)}% split
            </p>
          </div>
          <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition-colors active:opacity-80 ${
        isBlown
          ? 'bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 opacity-70'
          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: firm?.color }}>{firm?.name}</span>
            <span className="text-gray-300 dark:text-gray-500 text-sm">·</span>
            <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
              ${(account.size / 1000).toFixed(0)}K
            </span>
            {account.label && (
              <span className="text-gray-400 dark:text-gray-500 text-xs">({account.label})</span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
            {account.phase} · {effectiveRules?.planName ?? 'Standard'} · {(effectiveRules?.split * 100).toFixed(0)}% split
          </p>
          {account.phase === 'evaluation' && account.purchaseDateTime && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Purchased {formatPurchaseDateTime(account.purchaseDateTime)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isBlown ? 'bg-red-500' : statusDot}`} />
          {isBlown ? (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              Blown
            </span>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              account.phase === 'funded'
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
            }`}>
              {account.phase === 'funded' ? 'Funded' : 'Eval'}
            </span>
          )}
        </div>
      </div>

      {/* P&L + target */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className={`text-2xl font-bold ${pnlColor}`}>
          {m.totalPnL >= 0 ? '+' : ''}${m.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        {effectiveRules && (
          <span className="text-gray-400 dark:text-gray-500 text-sm">
            / ${effectiveRules.profitTarget.toLocaleString()} target
          </span>
        )}
      </div>
      {effectiveRules && (
        <ProgressBar
          value={Math.max(m.totalPnL, 0)} max={effectiveRules.profitTarget}
          baseColor="bg-green-500" warnAt={999} dangerAt={999}
          height="h-1.5"
        />
      )}

      {/* Metrics row */}
      {effectiveRules && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <MiniMetric
            label="Drawdown"
            value={`$${m.currentDrawdown.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            pct={ddPct} warn={0.75} danger={0.90}
          />
          <MiniMetric
            label="Today"
            value={`${m.todayPnL >= 0 ? '+' : ''}$${Math.abs(m.todayPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            color={m.todayPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
            pct={effectiveRules.hasDLL && m.todayPnL < 0 ? Math.abs(m.todayPnL) / effectiveRules.dailyLossLimit : 0}
            warn={0.75} danger={0.90}
          />
          {consistencyEnabled ? (
            <MiniMetric
              label="Consistency"
              value={`${(m.consistencyPct * 100).toFixed(0)}%`}
              sub={`/ ${(effectiveRules.consistencyRule * 100).toFixed(0)}%`}
              color={m.consistencyPct > effectiveRules.consistencyRule
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-200'}
              pct={m.consistencyPct / effectiveRules.consistencyRule}
              warn={0.85} danger={1.0}
            />
          ) : (
            <MiniMetric
              label="Consistency"
              value={`${(m.consistencyPct * 100).toFixed(0)}%`}
              sub="no rule"
              color="text-gray-700 dark:text-gray-200"
              pct={0}
              warn={0.85} danger={1.0}
            />
          )}
        </div>
      )}

      {/* Alert strip */}
      {alerts.length > 0 && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${
          hasDanger
            ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
            : hasWarning
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
            : 'bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300'
        }`}>
          {alerts[0].msg}
        </div>
      )}

      {/* Cost / payout summary */}
      {(totalCost > 0 || totalPaidOut > 0) && (
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800 text-xs">
          {totalCost > 0 && (
            <span className="text-red-600 dark:text-red-400">
              −${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
            </span>
          )}
          {totalCost > 0 && totalPaidOut > 0 && (
            <span className="text-gray-300 dark:text-gray-600">·</span>
          )}
          {totalPaidOut > 0 && (
            <span className="text-green-600 dark:text-green-400">
              +${totalPaidOut.toLocaleString(undefined, { maximumFractionDigits: 0 })} paid out
            </span>
          )}
        </div>
      )}

    </button>
  );
}

function formatPurchaseDateTime(dt) {
  const d = new Date(dt);
  return d.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function MiniMetric({ label, value, sub, color = 'text-gray-700 dark:text-gray-200', pct = 0, warn, danger }) {
  const barColor = pct >= danger ? 'bg-red-500' : pct >= warn ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600';
  const clamped = Math.min(pct, 1);
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>
        {value}{sub && <span className="text-gray-400 dark:text-gray-500 text-xs ml-0.5">{sub}</span>}
      </p>
      <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${clamped * 100}%` }} />
      </div>
    </div>
  );
}
