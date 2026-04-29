const STYLES = {
  danger:  'bg-red-50 border-red-300 text-red-700 dark:bg-red-950/70 dark:border-red-700 dark:text-red-300',
  warning: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/70 dark:border-amber-700 dark:text-amber-300',
  info:    'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/70 dark:border-blue-700 dark:text-blue-300',
  success: 'bg-green-50 border-green-300 text-green-700 dark:bg-green-950/70 dark:border-green-700 dark:text-green-300',
};

const ICONS = { danger: '🚨', warning: '⚠️', info: 'ℹ️', success: '✅' };

export default function AlertBanner({ level = 'info', msg }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5 ${STYLES[level]}`}>
      <span className="flex-shrink-0 mt-0.5">{ICONS[level]}</span>
      <span>{msg}</span>
    </div>
  );
}
