import { CheckCircle2, Circle, AlertTriangle, Flame } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTaskStats } from '../tasks/useTasks';
import { Spinner } from '../../components/ui/Spinner';

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="card p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const { user, company } = useAuth();
  const { data: stats, isLoading } = useTaskStats();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Welcome back, {user?.name.split(' ')[0]}</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {company ? `${company.name} · ${company.plan} plan` : 'Here is what is happening across your work.'}
        </p>
      </div>

      {isLoading || !stats ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Circle} label="Total tasks" value={stats.total} tone="bg-brand-50 text-brand-600" />
          <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Flame} label="High priority" value={stats.highPriority} tone="bg-amber-50 text-amber-600" />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} tone="bg-rose-50 text-rose-600" />
        </div>
      )}
    </div>
  );
}
