const STYLES = {
  danger:  'bg-red-950/70 border-red-700 text-red-300',
  warning: 'bg-amber-950/70 border-amber-700 text-amber-300',
  info:    'bg-blue-950/70 border-blue-700 text-blue-300',
  success: 'bg-green-950/70 border-green-700 text-green-300',
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
