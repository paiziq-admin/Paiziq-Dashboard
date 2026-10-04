interface Distribution {
  approved: number;
  needsReview: number;
  rejected: number;
}

export function DecisionDonut({ distribution }: { distribution: Distribution }) {
  const total = distribution.approved + distribution.needsReview + distribution.rejected;
  const circumference = 2 * Math.PI * 60;
  const approved = total ? (distribution.approved / total) * circumference : 0;
  const review = total ? (distribution.needsReview / total) * circumference : 0;
  const rejected = total ? (distribution.rejected / total) * circumference : 0;
  return (
    <div className="grid h-full min-h-[320px] grid-cols-[minmax(180px,0.95fr)_minmax(150px,1fr)] items-center gap-[22px] max-[760px]:min-h-0 max-[760px]:grid-cols-1">
      <svg aria-label="Decision distribution" className="h-[190px] w-[190px] shrink-0 justify-self-center" role="img" viewBox="0 0 160 160">
        <circle cx="80" cy="80" fill="none" r="60" stroke="rgba(86,66,86,0.08)" strokeWidth="20" />
        <circle cx="80" cy="80" fill="none" r="60" stroke="var(--success)" strokeDasharray={`${approved} ${circumference}`} strokeDashoffset="0" strokeWidth="20" transform="rotate(-90 80 80)" />
        <circle cx="80" cy="80" fill="none" r="60" stroke="var(--warning)" strokeDasharray={`${review} ${circumference}`} strokeDashoffset={-approved} strokeWidth="20" transform="rotate(-90 80 80)" />
        <circle cx="80" cy="80" fill="none" r="60" stroke="var(--danger)" strokeDasharray={`${rejected} ${circumference}`} strokeDashoffset={-(approved + review)} strokeWidth="20" transform="rotate(-90 80 80)" />
        <text fill="var(--foreground)" fontFamily="Hanken Grotesk, sans-serif" fontSize="22" fontWeight="800" textAnchor="middle" x="80" y="76">
          {total.toLocaleString()}
        </text>
        <text fill="#96939b" fontFamily="Hanken Grotesk, sans-serif" fontSize="10" textAnchor="middle" x="80" y="94">
          decisions
        </text>
      </svg>
      <div className="flex min-w-0 flex-col gap-[10px] text-[13px]">
        <LegendRow color="var(--success)" label="Approved" value={distribution.approved.toLocaleString()} />
        <LegendRow color="var(--warning)" label="Needs review" value={distribution.needsReview.toLocaleString()} />
        <LegendRow color="var(--danger)" label="Rejected" value={distribution.rejected.toLocaleString()} />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: color }} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <b className="mono pl-[10px] text-[12.5px]">{value}</b>
    </div>
  );
}
