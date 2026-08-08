import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckSquare, Video, PlaneTakeoff } from 'lucide-react';
import clsx from 'clsx';
import { useCalendarEvents, getMonthGridRange } from './useCalendar';
import { Spinner } from '../../components/ui/Spinner';
import { CalendarEvent } from '../../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY_DOT: Record<string, string> = {
  High: 'bg-rose-500',
  Medium: 'bg-amber-500',
  Low: 'bg-emerald-500',
};

function eventDateStr(event: CalendarEvent): string {
  if (event.kind === 'task') return event.date;
  if (event.kind === 'meeting') return new Date(event.startTime).toISOString().slice(0, 10);
  return event.startDate; // leave — see eventsByDate below for the full range
}

function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CalendarPage() {
  const navigate = useNavigate();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const { data: events, isLoading } = useCalendarEvents(monthDate);
  const { gridStart } = getMonthGridRange(monthDate);

  const days = useMemo(() => {
    const cells: Date[] = [];
    const cursor = new Date(gridStart);
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  }, [gridStart]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    function add(dateKey: string, event: CalendarEvent) {
      const list = map.get(dateKey) ?? [];
      list.push(event);
      map.set(dateKey, list);
    }
    for (const event of events ?? []) {
      if (event.kind === 'leave') {
        for (const dateKey of dateRange(event.startDate, event.endDate)) add(dateKey, event);
      } else {
        add(eventDateStr(event), event);
      }
    }
    return map;
  }, [events]);

  function shiftMonth(delta: number) {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  const monthLabel = monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const today = todayStr();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Calendar</h1>
          <p className="mt-0.5 text-sm text-slate-500">Task due dates and meetings in one view.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary !px-2.5 !py-1.5" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={15} />
          </button>
          <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setMonthDate(new Date())}>
            Today
          </button>
          <button className="btn-secondary !px-2.5 !py-1.5" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight size={15} />
          </button>
          <span className="ml-2 text-sm font-medium text-slate-700">{monthLabel}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-surface-subtle">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateStr = day.toISOString().slice(0, 10);
              const inMonth = day.getMonth() === monthDate.getMonth();
              const dayEvents = eventsByDate.get(dateStr) ?? [];
              const visible = dayEvents.slice(0, 3);
              const overflow = dayEvents.length - visible.length;

              return (
                <div
                  key={dateStr}
                  className={clsx(
                    'min-h-[104px] border-b border-r border-border p-1.5 last:border-r-0',
                    !inMonth && 'bg-surface-subtle/50'
                  )}
                >
                  <div className={clsx('mb-1 text-xs', dateStr === today ? 'font-semibold text-brand-600' : inMonth ? 'text-slate-600' : 'text-slate-300')}>
                    {dateStr === today ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                        {day.getDate()}
                      </span>
                    ) : (
                      day.getDate()
                    )}
                  </div>
                  <div className="space-y-1">
                    {visible.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => navigate(event.link)}
                        className={clsx(
                          'flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:opacity-80',
                          event.kind === 'meeting'
                            ? 'bg-brand-50 text-brand-700'
                            : event.kind === 'leave'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        )}
                        title={event.title}
                      >
                        {event.kind === 'task' ? (
                          <>
                            <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', PRIORITY_DOT[event.priority])} />
                            <CheckSquare size={10} className="shrink-0" />
                          </>
                        ) : event.kind === 'leave' ? (
                          <PlaneTakeoff size={10} className="shrink-0" />
                        ) : (
                          <Video size={10} className="shrink-0" />
                        )}
                        <span className="truncate">{event.title}</span>
                      </button>
                    ))}
                    {overflow > 0 && <div className="px-1 text-[11px] text-slate-400">+{overflow} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
