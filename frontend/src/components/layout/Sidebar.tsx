import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  Users2,
  Building,
  CalendarClock,
  CalendarCheck,
  Video,
  MessageSquare,
  Bell,
  BarChart3,
  ScrollText,
  Sparkles,
  FolderOpen,
  Settings as SettingsIcon,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import clsx from 'clsx';
import { Role } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/team', label: 'Team', icon: Users2 },
  { to: '/departments', label: 'Departments', icon: Building },
  { to: '/calendar', label: 'Calendar', icon: CalendarCheck },
  { to: '/meetings', label: 'Meetings', icon: Video },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/attendance', label: 'Attendance', icon: CalendarClock },
  { to: '/leave', label: 'Leave', icon: CalendarClock },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['company_admin', 'team_lead'] },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/activity-logs', label: 'Activity Logs', icon: ScrollText, roles: ['company_admin', 'team_lead'] },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-white">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
          <Compass size={16} />
        </div>
        <span className="text-sm font-semibold text-slate-900">WorkPilot</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {isSuperAdmin ? (
          <NavLink
            to="/platform"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-surface-subtle hover:text-slate-900'
              )
            }
          >
            <ShieldCheck size={16} />
            Platform admin
          </NavLink>
        ) : (
          NAV_ITEMS.filter((item) => !item.roles || hasRole(...item.roles)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-surface-subtle hover:text-slate-900'
                )
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))
        )}
      </nav>
    </aside>
  );
}
