export default function ProgressBar({
  value,
  max,
  baseColor = 'bg-blue-500',
  warnAt = 0.75,
  dangerAt = 0.90,
  label,
  sublabel,
  height = 'h-2',
}) {
  const pct = max > 0 ? Math.min(Math.abs(value) / max, 1) : 0;
  const barColor =
    pct >= dangerAt ? 'bg-red-500' :
    pct >= warnAt   ? 'bg-amber-500' :
    baseColor;

  return (
    <div>
      {(label || sublabel) && (
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
          {label   && <span>{label}</span>}
          {sublabel && <span>{sublabel}</span>}
        </div>
      )}
      <div className={`${height} bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
