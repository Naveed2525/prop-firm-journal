import { useState } from 'react';
import ProgressBar from './ProgressBar';
import LogTradeModal from './LogTradeModal';
import { PersonalRuleCard } from './PersonalRules';
import { todayKey, defaultDay, computeWeeklySummary, formatDisplayDate } from '../utils/tradingPlanUtils';

const BEFORE_ITEMS = [
  { key: 'affirmation', label: 'Read daily affirmation out loud' },
  { key: 'positionSize', label: 'Confirmed my position size for this week' },
  { key: 'marketConditions', label: 'Market conditions reviewed' },
];

const END_OF_DAY_ITEMS = [
  { key: 'noRevenge', label: 'No revenge trading today' },
  { key: 'positionSizeRules', label: 'Followed position size rules' },
  { key: 'maxTrades', label: 'Maximum 2 trades respected' },
];

const CHECKLIST_ITEM_COUNT = BEFORE_ITEMS.length + END_OF_DAY_ITEMS.length;

export default function DailyChecklistTab({ doc, loading, updateSection, logTrade }) {
  const [showLogTrade, setShowLogTrade] = useState(false);
  const [toggleError, setToggleError] = useState('');

  const date = todayKey();
  const day = doc.days?.[date] ?? defaultDay();
  const rules = doc.personalRules ?? [];
  const progress = doc.progress ?? { consecutiveCleanTrades: 0, bestStreak: 0, resetLog: [] };
  const consecutive = progress.consecutiveCleanTrades ?? 0;
  const goalHit = consecutive >= 20;
  const lastReset = progress.resetLog?.[0];
  const weekly = computeWeeklySummary(doc.days);

  const completedItems =
    BEFORE_ITEMS.filter((item) => !!day.before?.[item.key]).length +
    END_OF_DAY_ITEMS.filter((item) => !!day.endOfDay?.[item.key]).length;
  const checklistComplete = completedItems === CHECKLIST_ITEM_COUNT;

  // Optimistic — updateSection already applies the change instantly and rolls
  // back on failure, so this just surfaces an error if the save didn't stick.
  const toggle = async (section, key, current) => {
    setToggleError('');
    try {
      await updateSection(date, section, { [key]: !current });
    } catch (e) {
      setToggleError(e.message || "Couldn't save that — check your connection and try again.");
    }
  };

  const handleLogTrade = async (fields) => {
    await logTrade(date, fields);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Today's date + completion */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{formatDisplayDate(date)}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Resets automatically each day at midnight</p>
          </div>
          {checklistComplete && (
            <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              All done
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Today's checklist</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">{completedItems} / {CHECKLIST_ITEM_COUNT} completed</span>
          </div>
          <ProgressBar
            value={completedItems}
            max={CHECKLIST_ITEM_COUNT}
            baseColor={checklistComplete ? 'bg-green-500' : 'bg-blue-500'}
            warnAt={999}
            dangerAt={999}
            height="h-2"
          />
        </div>
      </div>

      {toggleError && (
        <div className="rounded-lg px-3 py-2 text-xs bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
          {toggleError}
        </div>
      )}

      {rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule) => (
            <PersonalRuleCard key={rule.id} rule={rule} compact />
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Consecutive Clean Trades</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">Best: {progress.bestStreak ?? 0}</span>
        </div>
        <ProgressBar
          value={Math.min(consecutive, 20)}
          max={20}
          baseColor="bg-emerald-500"
          warnAt={999}
          dangerAt={999}
          height="h-2.5"
        />
        <p className={`text-2xl font-bold mt-2 ${goalHit ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
          {consecutive} / 20 <span className="text-sm font-medium text-gray-400 dark:text-gray-500">consecutive clean trades</span>
        </p>
        {lastReset && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Last reset: {lastReset.note} <span className="text-gray-300 dark:text-gray-600">({lastReset.date})</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <StatPill
            label="This week trades clean"
            value={weekly.tradeCompliancePct != null ? `${weekly.tradeCompliancePct}%` : '—'}
          />
          <StatPill
            label="This week checklist"
            value={weekly.checklistCompliancePct != null ? `${weekly.checklistCompliancePct}%` : '—'}
          />
        </div>
      </div>

      {/* Before trading */}
      <ChecklistCard title="Before Trading">
        {BEFORE_ITEMS.map((item) => (
          <ChecklistItem
            key={item.key}
            checked={!!day.before?.[item.key]}
            onChange={() => toggle('before', item.key, !!day.before?.[item.key])}
          >
            {item.label}
          </ChecklistItem>
        ))}
      </ChecklistCard>

      {/* Trade log */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Trade Checks Today</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{day.trades?.length ?? 0} logged</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Before every trade + after every trade</p>

        {(day.trades?.length ?? 0) >= 2 && (
          <div className="mb-3 rounded-lg px-3 py-2 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            You've hit today's 2-trade limit — stick to your rules and stop here.
          </div>
        )}

        {day.trades?.length > 0 && (
          <div className="space-y-2 mb-3">
            {day.trades.map((t) => (
              <TradeRow key={t.id} trade={t} />
            ))}
          </div>
        )}

        <button
          onClick={() => setShowLogTrade(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log a Trade Check
        </button>
      </div>

      {/* End of day */}
      <ChecklistCard title="End of Day">
        {END_OF_DAY_ITEMS.map((item) => (
          <ChecklistItem
            key={item.key}
            checked={!!day.endOfDay?.[item.key]}
            onChange={() => toggle('endOfDay', item.key, !!day.endOfDay?.[item.key])}
          >
            {item.label}
          </ChecklistItem>
        ))}
      </ChecklistCard>

      {showLogTrade && (
        <LogTradeModal onSave={handleLogTrade} onClose={() => setShowLogTrade(false)} />
      )}
    </div>
  );
}

function ChecklistCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
    </div>
  );
}

function ChecklistItem({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-3 py-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 accent-blue-600 rounded flex-shrink-0"
      />
      <span className={`text-sm ${checked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
        {children}
      </span>
    </label>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="flex-1 min-w-[45%] bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function TradeRow({ trade }) {
  const time = new Date(trade.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trade.clean
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
          }`}
        >
          {trade.clean ? 'Clean' : 'Broke a rule'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
      </div>
      {(trade.whyEntered || trade.emotion) && (
        <div className="mt-1.5 space-y-0.5">
          {trade.whyEntered && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="text-gray-400 dark:text-gray-500">Why:</span> {trade.whyEntered}
            </p>
          )}
          {trade.emotion && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="text-gray-400 dark:text-gray-500">Felt:</span> {trade.emotion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
