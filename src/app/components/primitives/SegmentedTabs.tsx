export interface SegmentedTab {
  label: string;
  value: string;
}

export function SegmentedTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: SegmentedTab[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-[18px] inline-flex flex-wrap gap-[4px] rounded-[11px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.5)] p-[4px] backdrop-blur-[14px]">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            className="focus-ring h-[32px] rounded-[8px] border-0 px-[14px] text-[12.5px] font-bold"
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            style={{
              background: active ? "var(--primary)" : "transparent",
              color: active ? "#ffffff" : "var(--text-secondary)",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

