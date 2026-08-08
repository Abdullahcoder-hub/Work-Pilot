import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, UserPlus, CheckCircle2, ShieldCheck, Circle, CalendarClock, CalendarX, MessageCircle, PlaneTakeoff } from 'lucide-react';
import clsx from 'clsx';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppNotification } from '../../types';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from './useNotifications';

const ICONS: Record<AppNotification['type'], typeof Bell> = {
  task_assigned: UserPlus,
  task_completed: CheckCircle2,
  task_approved: ShieldCheck,
  task_status_changed: Circle,
  meeting_invite: CalendarClock,
  meeting_updated: CalendarClock,
  meeting_cancelled: CalendarX,
  direct_message: MessageCircle,
  leave_approved: PlaneTakeoff,
  leave_rejected: PlaneTakeoff,
};

export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleClick(n: AppNotification) {
    if (!n.isRead) markRead.mutate(n._id);
    if (n.channelId) navigate(`/chat?channel=${encodeURIComponent(n.channelId)}`);
    else if (n.leaveId) navigate('/leave');
    else if (n.taskId) navigate('/tasks');
    else if (n.meetingId) navigate('/meetings');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-slate-500">Stay on top of what needs your attention.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead.mutate()} className="btn-secondary">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New task assignments, completions, and approvals will show up here." />
      ) : (
        <div className="card divide-y divide-border">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={clsx('flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-surface-subtle', !n.isRead && 'bg-brand-50/40')}
              >
                <div className={clsx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', n.isRead ? 'bg-slate-100 text-slate-400' : 'bg-brand-100 text-brand-600')}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={clsx('text-sm', n.isRead ? 'text-slate-600' : 'font-medium text-slate-800')}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
