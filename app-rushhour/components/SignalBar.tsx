export function SignalBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-medium text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-ink">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-cloud">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rausch to-rausch-dark transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
