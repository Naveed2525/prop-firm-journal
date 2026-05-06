import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PROP_FIRMS, getRules } from '../data/propFirms';
import { computeMetrics, getAlerts } from '../utils/metrics';
import { useTrades, usePayouts } from '../hooks/useData';
import AlertBanner from './AlertBanner';
import ProgressBar from './ProgressBar';
import TradeList from './TradeList';
import AddTradeModal from './AddTradeModal';
import Reports from './Reports';
import Charts from './Charts';
import RiskCalculator from './RiskCalculator';
import Payouts from './Payouts';
import EditAccountModal from './EditAccountModal';

export default function AccountDetail({ accounts, onDeleteAccount, onUpdateAccount }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trades, loading, addTrade, deleteTrade } = useTrades(id);
  const { payouts, loading: payoutsLoading, addPayout, updatePayout, deletePayout } = usePayouts(id);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
const [showEdit, setShowEdit] = useState(false);

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
  // Apply per-account consistency override (null = firm default, 0 = disabled, >0 = custom %)
  const effectiveRules = applyConsistencyOverride(rules, account.consistencyOverride);
  const m     = computeMetrics(trades, payouts);
  const alerts = getAlerts(m, effectiveRules);

  // Current account balance = starting size + all P&L - received payouts
  const accountBalance = account.size + m.totalPnL - m.totalPayoutsReceived;

  const isBlownByDrawdown = effectiveRules && m.currentDrawdown >= effectiveRules.maxDrawdown;
  const shouldSuggestBlown = isBlownByDrawdown && !account.blown;

  const handleMarkBlown = async () => {
    await onUpdateAccount(id, { blown: true });
  };

  const handleUnmarkBlown = async () => {
    await onUpdateAccount(id, { blown: false });
  };

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

  const consistencyEnabled = effectiveRules?.consistencyRule != null;

  const pnlColor = m.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const balanceColor = accountBalance >= account.size
    ? 'text-gray-900 dark:text-white'
    : 'text-red-600 dark:text-red-400';

  // Profit target: show progress within current payout cycle
  const cyclePnL = m.pnlSinceLastPayout;
  const cycleRemaining = effectiveRules ? Math.max(effectiveRules.profitTarget - cyclePnL, 0) : 0;
  const profitTargetLabel = m.lastPayoutDate ? 'Next Payout Target' : 'Profit Target';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-40">
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
              {account.phase} · {effectiveRules?.planName} · {effectiveRules ? `${(effectiveRules.split * 100).toFixed(0)}% split` : ''}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            account.blown
              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              : account.phase === 'funded'
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
          }`}>
            {account.blown ? 'Blown' : account.phase === 'funded' ? 'Funded' : 'Eval'}
          </span><button onClick={() => setShowEdit(true)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">Edit</button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Blown status banner */}
        {account.blown && (
          <div className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/70 px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300">
              <span className="flex-shrink-0 mt-0.5">💀</span>
              <span className="font-semibold">This account is marked as blown.</span>
            </div>
            <button
              onClick={handleUnmarkBlown}
              className="flex-shrink-0 text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Unmark
            </button>
          </div>
        )}

        {/* Suggest marking blown when drawdown is maxed */}
        {shouldSuggestBlown && (
          <div className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/70 px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300">
              <span className="flex-shrink-0 mt-0.5">🚨</span>
              <span>Max drawdown breached — mark this account as blown?</span>
            </div>
            <button
              onClick={handleMarkBlown}
              className="flex-shrink-0 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors"
            >
              Mark Blown
            </button>
          </div>
        )}

        {/* Alerts */}
        {alerts.map((a, i) => <AlertBanner key={i} level={a.level} msg={a.msg} />)}

        {/* P&L hero */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800">
          {/* Total P&L */}
          <div className="flex items-baseline gap-3 mb-1">
            <span className={`text-4xl font-bold ${pnlColor}`}>
              {m.totalPnL >= 0 ? '+' : ''}${m.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-sm">total P&L</span>
          </div>

          {/* Account Balance */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xl font-bold ${balanceColor}`}>
              ${accountBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">account balance</span>
            {m.totalPayoutsReceived > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                · ${m.totalPayoutsReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })} paid out
              </span>
            )}
          </div>

          {/* Profit Target progress — resets each payout cycle */}
          {effectiveRules && (
            <ProgressBar
              value={Math.max(cyclePnL, 0)} max={effectiveRules.profitTarget}
              baseColor="bg-green-500" warnAt={999} dangerAt={999}
              label={profitTargetLabel}
              sublabel={`$${cycleRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining`}
            />
          )}
        </div>

        {/* Metric grid */}
        {effectiveRules && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Today's P&L"
              value={fmtPnl(m.todayPnL)}
              color={m.todayPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              sub={effectiveRules.hasDLL ? `DLL: $${effectiveRules.dailyLossLimit.toLocaleString()}` : 'No DLL'}
            />
            <MetricCard
              label="Trailing Drawdown"
              value={`$${m.currentDrawdown.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color={m.currentDrawdown / effectiveRules.maxDrawdown >= 0.80
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'}
              sub={`Max: $${effectiveRules.maxDrawdown.toLocaleString()}${m.lastPayoutDate ? ' (since payout)' : ''}`}
            />
            <MetricCard
              label="Consistency"
              value={`${(m.consistencyPct * 100).toFixed(0)}%`}
              color={consistencyEnabled && m.consistencyPct > effectiveRules.consistencyRule
                ? 'text-red-600 dark:text-red-400'
                : consistencyEnabled
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-900 dark:text-white'}
              sub={consistencyEnabled
                ? `Limit: ${(effectiveRules.consistencyRule * 100).toFixed(0)}%${
                    account.firm === 'lucid' && account.phase === 'funded' ? ' (eval only)' : ''}`
                : 'No rule'}
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
        {effectiveRules && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Risk Gauges</h3>
            <ProgressBar
              label={`Trailing Drawdown Used${m.lastPayoutDate ? ' (since last payout)' : ''}`}
              sublabel={`$${m.currentDrawdown.toLocaleString(undefined,{maximumFractionDigits:0})} / $${effectiveRules.maxDrawdown.toLocaleString()}`}
              value={m.currentDrawdown} max={effectiveRules.maxDrawdown} baseColor="bg-blue-500"
            />
            {effectiveRules.hasDLL && (
              <ProgressBar
                label="Daily Loss Limit (today)"
                sublabel={`$${Math.abs(Math.min(m.todayPnL,0)).toLocaleString(undefined,{maximumFractionDigits:0})} / $${effectiveRules.dailyLossLimit.toLocaleString()}`}
                value={Math.abs(Math.min(m.todayPnL,0))} max={effectiveRules.dailyLossLimit} baseColor="bg-amber-500"
              />
            )}
            {consistencyEnabled && (
              <ProgressBar
                label="Consistency (best day / total profit)"
                sublabel={`${(m.consistencyPct*100).toFixed(0)}% / ${(effectiveRules.consistencyRule*100).toFixed(0)}% max`}
                value={m.consistencyPct} max={effectiveRules.consistencyRule} baseColor="bg-purple-500" warnAt={0.85} dangerAt={1.0}
              />
            )}
            <ProgressBar
              label={profitTargetLabel}
              sublabel={`$${Math.max(cyclePnL,0).toLocaleString(undefined,{maximumFractionDigits:0})} / $${effectiveRules.profitTarget.toLocaleString()}`}
              value={Math.max(cyclePnL,0)} max={effectiveRules.profitTarget} baseColor="bg-green-500" warnAt={999} dangerAt={999}
            />
          </div>
        )}

        {/* Rules accordion */}
        {effectiveRules && (
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
                <RuleCell label="Profit Target"    value={`$${effectiveRules.profitTarget.toLocaleString()}`} />
                <RuleCell label="Max Drawdown"     value={`$${effectiveRules.maxDrawdown.toLocaleString()}`} />
                <RuleCell label="Daily Loss Limit" value={effectiveRules.hasDLL ? `$${effectiveRules.dailyLossLimit.toLocaleString()}` : 'None ✓'} />
                <RuleCell label="Consistency Rule" value={
                  consistencyEnabled
                    ? `${(effectiveRules.consistencyRule * 100).toFixed(0)}% max/day`
                    : 'None (disabled)'
                } />
                <RuleCell label="Profit Split"     value={`${(effectiveRules.split * 100).toFixed(0)}% trader`} />
                <RuleCell label="Drawdown Type"    value="EOD Trailing" />
                {effectiveRules.notes && (
                  <div className="col-span-2 text-xs text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/60 rounded-xl px-3 py-2 leading-relaxed">
                    {effectiveRules.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* P&L Charts */}
        {!loading && trades.length > 0 && <Charts trades={trades} />}

        {/* Reports */}
        {!loading && trades.length > 0 && <Reports trades={trades} />}

        {/* Payouts — funded accounts only */}
        {account.phase === 'funded' && (
          <Payouts
            m={m} rules={effectiveRules}
            payouts={payouts} loading={payoutsLoading}
            addPayout={addPayout} updatePayout={updatePayout} deletePayout={deletePayout}
          />
        )}

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

      {/* Bottom nav bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-6"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(60px + env(safe-area-inset-bottom))' }}>
        <button onClick={() => navigate('/')}
          className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-medium">Back</span>
        </button>
        <button onClick={() => setShowAddTrade(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full w-14 h-14 text-3xl shadow-xl transition-colors flex items-center justify-center leading-none"
          style={{ boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}>
          +
        </button>
        <button onClick={() => setShowCalculator(true)}
          className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium">Calculator</span>
        </button>
      </div>

      {showAddTrade && (
        <AddTradeModal onSave={addTrade} onClose={() => setShowAddTrade(false)} />
      )}
{showEdit && (
        <EditAccountModal
          account={account}
          onSave={async (updates) => {
            await onUpdateAccount(account.id, updates);
            setShowEdit(false);
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showCalculator && (
        <RiskCalculator
          onClose={() => setShowCalculator(false)}
          accountSize={account.size}
          dllRemaining={effectiveRules?.hasDLL ? effectiveRules.dailyLossLimit - Math.abs(Math.min(m.todayPnL, 0)) : null}
          maxDrawdownRemaining={effectiveRules ? effectiveRules.maxDrawdown - m.currentDrawdown : null}
        />
      )}
    </div>
  );
}

function applyConsistencyOverride(rules, override) {
  if (!rules || override == null) return rules;
  return { ...rules, consistencyRule: override === 0 ? null : override };
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
