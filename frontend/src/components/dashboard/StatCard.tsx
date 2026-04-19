type Props = {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
};

export default function StatCard({ label, value, delta, positive = true }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <div className={positive ? "text-sm font-medium text-emerald-600" : "text-sm font-medium text-rose-600"}>
          {delta}
        </div>
      </div>
    </div>
  );
}