import ProgressBar from './ProgressBar';
import { PersonalRulesSection } from './PersonalRules';

const WEEK_SIZING = [
  { week: 'Week 1', size: '25% of normal size', note: 'Build the habit of following every rule before size matters.' },
  { week: 'Week 2', size: '50% of normal size', note: 'Only step up if Week 1 had zero rule violations.' },
  { week: 'Week 3', size: '75% of normal size', note: 'Only step up if Weeks 1–2 were both clean.' },
  { week: 'Week 4', size: '100% — full size', note: 'Only after 3 consecutive clean weeks. Any violation drops you back to Week 1.' },
];

const DAILY_RULES = [
  'Maximum 2 trades per day. No exceptions.',
  'Stop trading immediately after 2 losses — win or lose, the day is done.',
  'No revenge trading. Ever. A loss is the cost of doing business, not something to "win back."',
];

const BEFORE_TRADE = [
  'Is this one of my defined setups?',
  "Do I know exactly where I'll exit if I'm wrong?",
  'Am I risking the same amount I always risk?',
];

const AFTER_TRADE = [
  'Did I follow my rules? (yes or no — be honest)',
  'Why did I enter this trade?',
  'What emotion did I feel while in the trade?',
];

const WEEKLY_REVIEW = [
  'How many trades did I take this week, and how many followed every rule?',
  "What's the one rule I broke most often, and why?",
  "Was my position size correct for this week's stage?",
  'Did I stop after 2 losses every single day?',
  "What is the one thing I'll do differently next week?",
];

export default function MyPlanTab({ progress, rules, onAddRule, onUpdateRule, onDeleteRule }) {
  const consecutive = progress?.consecutiveCleanTrades ?? 0;
  const bestStreak = progress?.bestStreak ?? 0;
  const lastReset = progress?.resetLog?.[0];
  const goalHit = consecutive >= 20;

  return (
    <div className="space-y-4">
      <PersonalRulesSection
        rules={rules ?? []}
        onAdd={onAddRule}
        onUpdate={onUpdateRule}
        onDelete={onDeleteRule}
      />

      <PlanSection title="Daily Affirmation" sub="Read out loud before market opens">
        <p className="text-sm leading-relaxed italic text-gray-700 dark:text-gray-200">
          "I trade with discipline, not emotion. I follow my rules on every single trade, win or lose.
          I accept small, planned losses to protect my capital and my edge. I do not chase, revenge trade,
          or oversize to make back what I lost. My job is to execute my plan — the P&amp;L takes care of itself.
          Today, I trade like a professional."
        </p>
      </PlanSection>

      <PlanSection title="Position Size by Week">
        <div className="space-y-3">
          {WEEK_SIZING.map((w) => (
            <div key={w.week} className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-0.5 text-xs font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                {w.week}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{w.size}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{w.note}</p>
              </div>
            </div>
          ))}
        </div>
      </PlanSection>

      <PlanSection title="Daily Rules">
        <BulletList items={DAILY_RULES} />
      </PlanSection>

      <PlanSection title="Before Every Trade" sub="3 questions, every time">
        <NumberedList items={BEFORE_TRADE} />
      </PlanSection>

      <PlanSection title="After Every Trade" sub="3 things to write down">
        <NumberedList items={AFTER_TRADE} />
      </PlanSection>

      <PlanSection title="Weekly Review">
        <NumberedList items={WEEKLY_REVIEW} />
      </PlanSection>

      <Callout title="Personal Rule About Oversizing">
        I will never increase my position size to make back a loss. Oversizing after a loss is how one bad
        day turns into a blown account. If I feel the urge to size up after losing, that is my signal to
        stop trading for the day.
      </Callout>

      <PlanSection title="20 Consecutive Trades Commitment">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          My goal is 20 consecutive trades where I follow every single rule — no exceptions. One broken
          rule resets this counter to zero. This isn't about being profitable on every trade — it's about
          proving I can execute my plan with discipline, trade after trade.
        </p>
        <ProgressBar
          value={Math.min(consecutive, 20)}
          max={20}
          baseColor="bg-emerald-500"
          warnAt={999}
          dangerAt={999}
          height="h-2.5"
        />
        <div className="flex items-baseline justify-between mt-2">
          <span className={`text-2xl font-bold ${goalHit ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
            {consecutive} / 20
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">Best streak: {bestStreak}</span>
        </div>
        {goalHit && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">
            🎉 Goal reached — keep going, discipline compounds.
          </p>
        )}
        {lastReset && !goalHit && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Last reset: {lastReset.note} ({lastReset.date})
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          Log each trade check on the <span className="font-medium">Daily Checklist</span> tab to update this counter.
        </p>
      </PlanSection>
    </div>
  );
}

function PlanSection({ title, sub, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 mt-0.5">{sub}</p>}
      <div className={sub ? '' : 'mt-3'}>{children}</div>
    </div>
  );
}

function Callout({ title, children }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-4">
      <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        {title}
      </h2>
      <p className="text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed mt-2">{children}</p>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200">
          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400">
            {i + 1}
          </span>
          <span className="mt-px">{item}</span>
        </li>
      ))}
    </ol>
  );
}
