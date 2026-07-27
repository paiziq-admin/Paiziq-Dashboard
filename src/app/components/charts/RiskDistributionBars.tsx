interface RiskBucket {
  label: string;
  value: number;
  color: string;
}

export function RiskDistributionBars({ buckets }: { buckets: RiskBucket[] }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.value));
  return (
    <div aria-label="Decision risk-flag distribution" className="relative h-[220px] pt-[8px]" role="img">
      <div className="absolute inset-x-[18px] top-[34px] bottom-[48px] flex flex-col justify-between">
        <span className="border-t border-dashed border-[rgba(86,66,86,0.10)]" />
        <span className="border-t border-dashed border-[rgba(86,66,86,0.10)]" />
        <span className="border-t border-dashed border-[rgba(86,66,86,0.10)]" />
      </div>
      <div className="relative z-[1] grid h-full items-end gap-[28px] px-[34px] max-[900px]:gap-[14px] max-[640px]:px-[12px]" style={{ gridTemplateColumns: `repeat(${Math.max(1, buckets.length)}, minmax(0, 1fr))` }}>
        {buckets.map((bucket) => (
          <div className="flex h-full min-w-0 flex-col justify-end gap-[10px]" key={bucket.label}>
            <div className="flex h-[150px] flex-col justify-end">
              <div className="mb-[8px] text-center text-[18px] font-extrabold leading-none text-[var(--text-secondary)]">{bucket.value.toLocaleString()}</div>
              <div className="min-h-[4px] rounded-[8px]" style={{ background: bucket.color, height: `${Math.max(3, (bucket.value / max) * 100)}%` }} />
            </div>
            <div className="mono truncate text-center text-[15px] text-[var(--muted-foreground)]">{bucket.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
