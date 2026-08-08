import { LucideIcon } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

interface ComingSoonPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}

export function ComingSoonPage({ icon, title, description, phase }: ComingSoonPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <EmptyState
        icon={icon}
        title={`${title} arrives in ${phase}`}
        description="This module is on the roadmap and scoped, but not built yet — it isn't wired to any data source."
      />
    </div>
  );
}
