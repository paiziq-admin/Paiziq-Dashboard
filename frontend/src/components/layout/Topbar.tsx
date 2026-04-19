export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Dashboard Overview</h2>
        <p className="text-sm text-slate-500">Mock data</p>
      </div>

      <div className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">
        Demo environment
      </div>
    </header>
  );
}