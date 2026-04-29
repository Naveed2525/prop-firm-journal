import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PROP_FIRMS, getRules } from '../data/propFirms';
import { computeMetrics, getAlerts } from '../utils/metrics';
import { useTrades } from '../hooks/useData';
import AlertBanner from './AlertBanner';
import ProgressBar from './ProgressBar';
import TradeList from './TradeList';
import AddTradeModal from './AddTradeModal';
import Charts from './Charts';

export default function AccountDetail({ accounts, onDeleteAccount }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trades, loading, addTrade, deleteTrade } = useTrades(id);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const account = accounts.find((a) => a.id === id);
  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          Account not found.{' '}
          <button onClick={() => navigate('/')} className="text-blue-500 underline">Go back</button>
        </div>
      </div>
    );
  }

  const firm  = PROP_FIRMS[account.firm];
  const rules = getRules(account.firm, account.size, account.plan);
  const m     = computeMetrics(trades);
  const alerts = getAlerts(m, rules);

  const handleDelete = async () => {
    if (!confirm('Delete this account and all its trades? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDeleteAccount(id);
      navigate('/');
    } catch {
      setDeleting(false);
    }
  };

  const pnlColor = m.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: firm?.color }}>{firm?.name}</span>
              <span className="text-gray-300 dark:text-gray-500">·</span>
              <span className="text-gray-700 dark:text-gray-200">${(account.size / 1000).toFixed(0)}K</span>
              {account.label && (
                <span className="text-gray-400 dark:text-gray-500 text-sm truncate">· {account.label}</span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
              {account.phase} · {rules?.planName} · {rules ? `${(rules.split * 100).toFixed(0)}% split` : ''}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            account.phase === 'funded'
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
          }`}>
            {account.phase === 'funded' ? 'Funded' : 'Eval'}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Alerts */}
        {alerts.map((a, i) => <AlertBanner key={i} level={a.level} msg={a.msg} />)}

        {/* P&L hero */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800">
          <div className="flex items-baseline gap-3 mb-4">
            <span className={`text-4xl font-bold ${pnlColor}`}>
              {m.totalPnL >= 0 ? '+' : ''}${m.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-sm">total P&L</span>
          </div>
          {rules && (
            <ProgressBar
              value={Math.max(m.totalPnL, 0)} max={rules.profitTarget}
              baseColor="bg-green-500" warnAt={999} dangerAt={999}
              label="Profit Target"
              sublabel={`$${m.totalPnL > 0
                ? (rules.profitTarget - m.totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })
                : rules.profitTarget.toLocaleString()} remaining`}
            />
          )}
        </div>

        {/* Metric grid */}
        {rules && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Today's P&L"
              value={fmtPnl(m.todayPnL)}
              color={m.todayPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              sub={rules.hasDLL ? `DLL: $${rules.dailyLossLimit.toLocaleString()}` : 'No DLL'}
            />
            <MetricCard
              label="Trailing Drawdown"
              value={`$${m.currentDrawdown.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color={m.currentDrawdown / rules.maxDrawdown >= 0.80
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'}
              sub={`Max: $${rules.maxDrawdown.toLocaleString()}`}
            />
            <MetricCard
              label="Consistency"
              value={`${(m.consistencyPct * 100).toFixed(0)}%`}
              color={m.consistencyPct > rules.consistencyRule
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'}
              sub={`Limit: ${(rules.consistencyRule * 100).toFixed(0)}%${
                account.firm === 'lucid' && account.phase === 'funded' ? ' (eval only)' : ''}`}
            />
            <MetricCard
              label="Best Day"
              value={`+$${m.maxDayPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color="text-green-600 dark:text-green-400"
              sub={`${m.dayCount} trading day${m.dayCount !== 1 ? 's' : ''}`}
            />
          </div>
        )}

        {/* Risk gauges */}
        {rules && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Risk Gauges</h3>
            <ProgressBar
              label="Trailing Drawdown Used"
              sublabel={`$${m.currentDrawdown.toLocaleString(undefined,{maximumFractionDigits:0})} / $${rules.maxDrawdown.toLocaleString()}`}
              value={m.currentDrawdown} max={rules.maxDrawdown} baseColor="bg-blue-500"
            />
            {rules.hasDLL && (
              <ProgressBar
                label="Daily Loss Limit (today)"
                sublabel={`$${Math.abs(Math.min(m.todayPnL,0)).toLocaleString(undefined,{maximumFractionDigits:0})} / $${rules.dailyLossLimit.toLocaleString()}`}
                value={Math.abs(Math.min(m.todayPnL,0))} max={rules.dailyLossLimit} baseColor="bg-amber-500"
              />
            )}
            <ProgressBar
              label="Consistency (best day / total profit)"
              sublabel={`${(m.consistencyPct*100).toFixed(0)}% / ${(rules.consistencyRule*100).toFixed(0)}% max`}
              value={m.consistencyPct} max={rules.consistencyRule} baseColor="bg-purple-500" warnAt={0.85} dangerAt={1.0}
            />
            <ProgressBar
              label="Profit Target"
              sublabel={`$${m.totalPnL.toLocaleString(undefined,{maximumFractionDigits:0})} / $${rules.profitTarget.toLocaleString()}`}
              value={Math.max(m.totalPnL,0)} max={rules.profitTarget} baseColor="bg-green-500" warnAt={999} dangerAt={999}
            />
          </div>
        )}

        {/* Rules accordion */}
        {rules && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
            <button
              className="w-full flex items-center justify-between px-4 py-4 text-left"
              onClick={() => setShowRules((r) => !r)}
            >
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account Rules</span>
              <svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${showRules ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showRules && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                <RuleCell label="Profit Target"    value={`$${rules.profitTarget.toLocaleString()}`} />
                <RuleCell label="Max Drawdown"     value={`$${rules.maxDrawdown.toLocaleString()}`} />
                <RuleCell label="Daily Loss Limit" value={rules.hasDLL ? `$${rules.dailyLossLimit.toLocaleString()}` : 'None ✓'} />
                <RuleCell label="Consistency Rule" value={`${(rules.consistencyRule * 100).toFixed(0)}% max/day`} />
                <RuleCell label="Profit Split"     value={`${(rules.split * 100).toFixed(0)}% trader`} />
                <RuleCell label="Drawdown Type"    value="EOD Trailing" />
                {rules.notes && (
                  <div className="col-span-2 text-xs text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/60 rounded-xl px-3 py-2 leading-relaxed">
                    {rules.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* P&L Charts */}
        {!loading && trades.length > 0 && <Charts trades={trades} />}

        {/* Trade history */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Trade Log {!loading && `(${trades.length})`}
          </h3>
          {loading
            ? <div className="text-center py-10 text-gray-400 dark:text-gray-500">Loading…</div>
            : <TradeList trades={trades} onDelete={deleteTrade} />
          }
        </div>

        {/* Delete */}
        <div className="pt-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full text-red-500 hover:text-red-600 dark:hover:text-red-400 text-sm py-3 rounded-xl border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete Account & All Trades'}
          </button>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-5">
        <button
          onClick={() => setShowAddTrade(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full w-14 h-14 text-3xl shadow-xl transition-colors flex items-center justify-center leading-none"
          style={{ boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}
        >
          +
        </button>
      </div>

      {showAddTrade && (
        <AddTradeModal onSave={addTrade} onClose={() => setShowAddTrade(false)} />
      )}
    </div>
  );
}

function fmtPnl(n) {
  return `${n >= 0 ? '+' : ''}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function MetricCard({ label, value, color = 'text-gray-900 dark:text-white', sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 shadow-sm dark:shadow-none">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function RuleCell({ label, value }) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5">
      <p className="text-xs text-gray-400 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}
