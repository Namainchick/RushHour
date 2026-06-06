export function SignalBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-neutral-500">
        <span>{label}</span><span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-neutral-900 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
