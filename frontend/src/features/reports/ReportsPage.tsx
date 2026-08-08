import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ListChecks, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useReportsOverview } from './useReports';
import { Spinner } from '../../components/ui/Spinner';

const PRIORITY_COLORS: Record<string, string> = { High: '#f43f5e', Medium: '#f59e0b', Low: '#10b981' };
const CATEGORY_COLORS = ['#6047ff', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6'];
const PROJECT_COLOR_HEX: Record<string, string> = {
  brand: '#6047ff',
  teal: '#14b8a6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  sky: '#0ea5e9',
};

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof ListChecks; label: string; value: number; tone: string }) {
  return (
    <div className="card p-4">
      <div className={clsx('mb-2 flex h-8 w-8 items-center justify-center rounded-lg', tone)}>
        <Icon size={16} />
      </div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function ReportsPage() {
  const { data, isLoading } = useReportsOverview();

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const priorityData = Object.entries(data.taskStats.byPriority).map(([name, value]) => ({ name, value }));
  const categoryData = Object.entries(data.taskStats.byCategory).map(([name, value]) => ({ name, value }));
  const trendData = data.taskTrend.map((d) => ({ ...d, label: d.date.slice(5) }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500">A company-wide view of work, attendance, and leave.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Total tasks" value={data.taskStats.total} tone="bg-brand-50 text-brand-600" />
        <StatCard icon={CheckCircle2} label="Completed" value={data.taskStats.completed} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Pending" value={data.taskStats.pending} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={AlertTriangle} label="Overdue" value={data.taskStats.overdue} tone="bg-rose-50 text-rose-600" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Task activity — last 14 days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e8" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="created" name="Created" fill="#c2c9ff" radius={[3, 3, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#6047ff" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">By priority</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">By category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {categoryData.map((entry, i) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Attendance this month</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-lg font-semibold text-emerald-600">{data.attendance.present}</div>
              <div className="text-xs text-slate-500">Present</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-amber-600">{data.attendance.late}</div>
              <div className="text-xs text-slate-500">Late</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-sky-600">{data.attendance.halfDay}</div>
              <div className="text-xs text-slate-500">Half day</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-rose-600">{data.attendance.absent}</div>
              <div className="text-xs text-slate-500">Absent</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Leave</h2>
          <div className="mb-3 flex gap-4">
            <div>
              <div className="text-lg font-semibold text-amber-600">{data.leave.pending}</div>
              <div className="text-xs text-slate-500">Pending requests</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-emerald-600">{data.leave.approvedThisMonth}</div>
              <div className="text-xs text-slate-500">Approved this month</div>
            </div>
          </div>
          <div className="space-y-1">
            {Object.entries(data.leave.byType)
              .filter(([, count]) => count > 0)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-slate-500">{type}</span>
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Project progress</h2>
          {data.projectStats.length === 0 ? (
            <p className="text-sm text-slate-400">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {data.projectStats.map((p) => (
                <div key={p.projectId}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <span className="text-slate-400">
                      {p.done}/{p.total} · {p.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.progress}%`, backgroundColor: PROJECT_COLOR_HEX[p.color] ?? '#6047ff' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden p-0">
          <h2 className="px-4 pt-4 text-sm font-semibold text-slate-700">Team workload</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-y border-border bg-surface-subtle text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Person</th>
                <th className="px-4 py-2 font-medium">Assigned</th>
                <th className="px-4 py-2 font-medium">Completed</th>
                <th className="px-4 py-2 font-medium">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.teamWorkload.map((w) => (
                <tr key={w.userId}>
                  <td className="px-4 py-2 text-slate-700">{w.name}</td>
                  <td className="px-4 py-2 text-slate-600">{w.assigned}</td>
                  <td className="px-4 py-2 text-slate-600">{w.completed}</td>
                  <td className="px-4 py-2 text-slate-600">{w.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
