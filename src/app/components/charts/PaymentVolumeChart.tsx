import { useId } from "react";
import type { TimeseriesPoint } from "../../api/types";

export function PaymentVolumeChart({ points }: { points: TimeseriesPoint[] }) {
  const gradientId = useId().replace(/:/g, "");
  const width = 600;
  const height = 230;
  const plot = { left: 48, right: 570, top: 24, bottom: 190 };
  const max = Math.max(1, ...points.map((point) => point.value));
  const x = (index: number) =>
    points.length <= 1
      ? (plot.left + plot.right) / 2
      : plot.left + (index / (points.length - 1)) * (plot.right - plot.left);
  const y = (value: number) =>
    plot.bottom - (value / max) * (plot.bottom - plot.top);
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" L");
  const area = points.length
    ? `M${line} L${x(points.length - 1)},${plot.bottom} L${x(0)},${plot.bottom} Z`
    : "";
  const tickIndexes = points.length
    ? Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]))
    : [];

  return (
    <svg aria-label="Payment volume over time" className="block h-auto w-full" role="img" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fc814a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fc814a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="rgba(86,66,86,0.10)" strokeDasharray="3 4">
        {[0, 1, 2, 3].map((index) => {
          const lineY = plot.top + (index / 3) * (plot.bottom - plot.top);
          return <line key={index} x1={plot.left} x2={plot.right} y1={lineY} y2={lineY} />;
        })}
      </g>
      <g fill="var(--muted-foreground)" fontFamily="IBM Plex Mono, monospace" fontSize="11">
        {[0, 1, 2, 3].map((index) => {
          const value = Math.round(max * (1 - index / 3));
          const labelY = plot.top + (index / 3) * (plot.bottom - plot.top) + 4;
          return <text key={index} textAnchor="end" x={plot.left - 8} y={labelY}>{value}</text>;
        })}
        {tickIndexes.map((index) => (
          <text key={index} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} x={x(index)} y="216">
            {new Date(points[index].bucket_ms).toLocaleDateString(undefined, {
              month: points.length > 24 ? "short" : undefined,
              day: points.length > 24 ? "numeric" : undefined,
              hour: points.length <= 24 ? "2-digit" : undefined,
              minute: points.length <= 24 ? "2-digit" : undefined,
            })}
          </text>
        ))}
      </g>
      {points.length ? (
        <>
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={`M${line}`} fill="none" stroke="var(--accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          <g fill="var(--glass-panel-strong)" stroke="var(--accent)" strokeWidth="2">
            {points.map((point, index) => <circle key={point.bucket_ms} cx={x(index)} cy={y(point.value)} r="3.5" />)}
          </g>
        </>
      ) : (
        <text fill="var(--muted-foreground)" fontFamily="Hanken Grotesk, sans-serif" fontSize="13" textAnchor="middle" x="300" y="112">
          No time-series points in this range
        </text>
      )}
    </svg>
  );
}
