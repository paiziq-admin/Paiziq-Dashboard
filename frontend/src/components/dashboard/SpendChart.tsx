import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SpendPoint = {
  day: string;
  spend: number;
};

const data: SpendPoint[] = [
  { day: "Mon", spend: 1200 },
  { day: "Tue", spend: 2100 },
  { day: "Wed", spend: 1400 },
  { day: "Thu", spend: 2400 },
  { day: "Fri", spend: 1900 },
  { day: "Sat", spend: 2800 },
  { day: "Sun", spend: 2200 },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">
        ${payload[0]?.value?.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-500">Daily spend</p>
    </div>
  );
}

export default function SpendChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Spend Trend</h3>
          <p className="mt-1 text-sm text-slate-500">
            Weekly spend activity across payment operations
          </p>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Last 7 days
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span className="text-slate-600">Spend</span>
        </div>
        <div className="text-slate-300">|</div>
        <div className="text-slate-500">Peak: $2,800</div>
        <div className="text-slate-300">|</div>
        <div className="text-slate-500">Avg: $1,986</div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#spendGradient)"
              dot={{ r: 3.5, fill: "#2563eb", strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2, fill: "#ffffff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}