export function RiskDistributionBars() {
  const buckets = [
    { label: "0-20", value: "1,580", height: "100%", color: "#4a8a68", opacity: 0.85 },
    { label: "21-40", value: "720", height: "46%", color: "#4a8a68", opacity: 0.55 },
    { label: "41-60", value: "380", height: "24%", color: "#d9973b", opacity: 0.85 },
    { label: "61-80", value: "130", height: "8%", color: "#c05b47", opacity: 0.75 },
    { label: "81-100", value: "37", height: "3%", color: "#c05b47", opacity: 1 },
  ];

  return (
    <div aria-label="Risk score distribution" className="relative h-[220px] pt-[8px]" role="img">
      <div className="absolute inset-x-[18px] top-[34px] bottom-[48px] flex flex-col justify-between">
        <span className="border-t border-dashed border-[rgba(86,66,86,0.10)]" />
        <span className="border-t border-dashed border-[rgba(86,66,86,0.10)]" />
        <span className="border-t border-dashed border-[rgba(86,66,86,0.10)]" />
      </div>
      <div className="relative z-[1] grid h-full grid-cols-5 items-end gap-[28px] px-[34px] max-[900px]:gap-[14px] max-[640px]:px-[12px]">
        {buckets.map((bucket) => (
          <div className="flex h-full min-w-0 flex-col justify-end gap-[10px]" key={bucket.label}>
            <div className="flex h-[150px] flex-col justify-end">
              <div className="mb-[8px] text-center text-[18px] font-extrabold leading-none text-[var(--text-secondary)]">{bucket.value}</div>
              <div className="min-h-[4px] rounded-[8px]" style={{ background: bucket.color, height: bucket.height, opacity: bucket.opacity }} />
            </div>
            <div className="mono truncate text-center text-[15px] text-[var(--muted-foreground)]">{bucket.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

