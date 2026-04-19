import DashboardShell from "../components/layout/DashboardShell";
import StatCard from "../components/dashboard/StatCard";
import SpendChart from "../components/dashboard/SpendChart";

const recentActivity = [
  { title: "Vendor invoice approved", time: "2 min ago", status: "Approved" },
  { title: "Payment request submitted", time: "18 min ago", status: "Pending" },
  { title: "Supply order created", time: "1 hr ago", status: "Completed" },
  { title: "Exception flagged by agent", time: "3 hrs ago", status: "Alert" },
];

export default function Overview() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Spend" value="$24,500" delta="+12.4%" />
          <StatCard label="Pending Approvals" value="18" delta="+3" />
          <StatCard label="Active Agents" value="42" delta="+5%" />
          <StatCard label="Savings" value="$3,200" delta="+8.1%" />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SpendChart />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold">Recent Activity</h3>
              <p className="text-sm text-slate-500">Latest system events</p>
            </div>

            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.title} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.time}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Recent Transactions</h3>
              <p className="text-sm text-slate-500">Mock table for later API hookup</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {[
                  ["Amazon Business", "Office Supplies", "Approved", "$840"],
                  ["Uber Eats", "Meals", "Pending", "$126"],
                  ["Staples", "Equipment", "Approved", "$410"],
                ].map(([vendor, category, status, amount]) => (
                  <tr key={`${vendor}-${amount}`} className="text-slate-700">
                    <td className="px-4 py-3">{vendor}</td>
                    <td className="px-4 py-3">{category}</td>
                    <td className="px-4 py-3">{status}</td>
                    <td className="px-4 py-3 text-right">{amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}