import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, UserPlus, CheckCircle2, ShieldCheck, Circle, CalendarClock, CalendarX, MessageCircle, PlaneTakeoff } from 'lucide-react';
import clsx from 'clsx';
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

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleClick(n: AppNotification) {
    if (!n.isRead) markRead.mutate(n._id);
    setOpen(false);
    if (n.channelId) navigate(`/chat?channel=${encodeURIComponent(n.channelId)}`);
    else if (n.leaveId) navigate('/leave');
    else if (n.taskId) navigate('/tasks');
    else if (n.meetingId) navigate('/meetings');
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-slate-500 hover:bg-surface-subtle hover:text-slate-700"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-white shadow-popover">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-sm font-semibold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">You're all caught up.</div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICONS[n.type] ?? Bell;
                  return (
                    <button
                      key={n._id}
                      onClick={() => handleClick(n)}
                      className={clsx(
                        'flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-surface-subtle',
                        !n.isRead && 'bg-brand-50/50'
                      )}
                    >
                      <div
                        className={clsx(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          n.isRead ? 'bg-slate-100 text-slate-400' : 'bg-brand-100 text-brand-600'
                        )}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={clsx('text-sm', n.isRead ? 'text-slate-600' : 'font-medium text-slate-800')}>
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
