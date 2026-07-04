export function DecisionDonut() {
  return (
    <div className="flex flex-wrap items-center gap-[18px]">
      <svg aria-label="Decision distribution" className="h-[140px] w-[140px] shrink-0" role="img" viewBox="0 0 160 160">
        <circle cx="80" cy="80" fill="none" r="60" stroke="rgba(86,66,86,0.08)" strokeWidth="20" />
        <circle cx="80" cy="80" fill="none" r="60" stroke="#4a8a68" strokeDasharray="296 377" strokeDashoffset="0" strokeWidth="20" transform="rotate(-90 80 80)" />
        <circle cx="80" cy="80" fill="none" r="60" stroke="#d9973b" strokeDasharray="60.4 377" strokeDashoffset="-296" strokeWidth="20" transform="rotate(-90 80 80)" />
        <circle cx="80" cy="80" fill="none" r="60" stroke="#c05b47" strokeDasharray="20.7 377" strokeDashoffset="-356.4" strokeWidth="20" transform="rotate(-90 80 80)" />
        <text fill="#3a2f3c" fontFamily="Hanken Grotesk, sans-serif" fontSize="22" fontWeight="800" textAnchor="middle" x="80" y="76">
          2,847
        </text>
        <text fill="#96939b" fontFamily="Hanken Grotesk, sans-serif" fontSize="10" textAnchor="middle" x="80" y="94">
          attempts
        </text>
      </svg>
      <div className="flex flex-col gap-[8px] text-[12px]">
        <LegendRow color="#4a8a68" label="Approved" value="2,234" />
        <LegendRow color="#d9973b" label="Review Required" value="457" />
        <LegendRow color="#c05b47" label="Blocked" value="156" />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-[7px]">
      <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: color }} />
      {label}
      <b className="ml-auto pl-[10px]">{value}</b>
    </div>
  );
}

