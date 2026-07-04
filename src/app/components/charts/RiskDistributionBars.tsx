export function RiskDistributionBars() {
  return (
    <svg aria-label="Risk score distribution" className="block h-auto w-full" role="img" viewBox="0 0 600 170">
      <g stroke="rgba(86,66,86,0.10)" strokeDasharray="3 4">
        <line x1="30" x2="590" y1="20" y2="20" />
        <line x1="30" x2="590" y1="80" y2="80" />
        <line x1="30" x2="590" y1="140" y2="140" />
      </g>
      <rect fill="#4a8a68" height="119" opacity="0.85" rx="6" width="70" x="55" y="21" />
      <rect fill="#4a8a68" height="54" opacity="0.55" rx="6" width="70" x="165" y="86" />
      <rect fill="#d9973b" height="29" opacity="0.85" rx="6" width="70" x="275" y="111" />
      <rect fill="#c05b47" height="10" opacity="0.75" rx="4" width="70" x="385" y="130" />
      <rect fill="#c05b47" height="3" rx="1.5" width="70" x="495" y="137" />
      <g fill="#96939b" fontFamily="IBM Plex Mono, monospace" fontSize="11" textAnchor="middle">
        <text x="90" y="158">0-20</text>
        <text x="200" y="158">21-40</text>
        <text x="310" y="158">41-60</text>
        <text x="420" y="158">61-80</text>
        <text x="530" y="158">81-100</text>
      </g>
      <g fill="#5c5462" fontFamily="Hanken Grotesk, sans-serif" fontSize="11" fontWeight="600" textAnchor="middle">
        <text x="90" y="14">1,580</text>
        <text x="200" y="79">720</text>
        <text x="310" y="104">380</text>
        <text x="420" y="124">130</text>
        <text x="530" y="131">37</text>
      </g>
    </svg>
  );
}

