export function PaymentVolumeChart() {
  return (
    <svg aria-label="Payment volume over time" className="block h-auto w-full" role="img" viewBox="0 0 600 230">
      <defs>
        <linearGradient id="volFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fc814a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fc814a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="rgba(86,66,86,0.10)" strokeDasharray="3 4">
        <line x1="40" x2="560" y1="30" y2="30" />
        <line x1="40" x2="560" y1="86" y2="86" />
        <line x1="40" x2="560" y1="143" y2="143" />
        <line x1="40" x2="560" y1="200" y2="200" />
      </g>
      <g fill="#96939b" fontFamily="IBM Plex Mono, monospace" fontSize="11">
        <text x="8" y="34">420</text>
        <text x="8" y="90">280</text>
        <text x="8" y="147">140</text>
        <text x="20" y="204">0</text>
        <text x="30" y="222">00:00</text>
        <text x="134" y="222">04:00</text>
        <text x="238" y="222">08:00</text>
        <text x="342" y="222">12:00</text>
        <text x="446" y="222">16:00</text>
        <text x="540" y="222">20:00</text>
      </g>
      <path d="M40,151 L144,166 L248,101 L352,46 L456,30 L560,83 L560,200 L40,200 Z" fill="url(#volFill)" />
      <path d="M40,151 L144,166 L248,101 L352,46 L456,30 L560,83" fill="none" stroke="#fc814a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      <g fill="#ffffff" stroke="#fc814a" strokeWidth="2">
        <circle cx="40" cy="151" r="3.5" />
        <circle cx="144" cy="166" r="3.5" />
        <circle cx="248" cy="101" r="3.5" />
        <circle cx="352" cy="46" r="3.5" />
        <circle cx="456" cy="30" r="3.5" />
        <circle cx="560" cy="83" r="3.5" />
      </g>
    </svg>
  );
}

