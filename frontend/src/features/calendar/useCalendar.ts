import { useQuery } from '@tanstack/react-query';
import * as calendarApi from './calendarApi';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns the Sun-Sat grid range that fully covers the given month, so leading/trailing days show too. */
export function getMonthGridRange(monthDate: Date): { from: string; to: string; gridStart: Date; gridEnd: Date } {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  return { from: toDateStr(gridStart), to: toDateStr(gridEnd), gridStart, gridEnd };
}

export function useCalendarEvents(monthDate: Date) {
  const { from, to } = getMonthGridRange(monthDate);
  return useQuery({
    queryKey: ['calendar', from, to],
    queryFn: () => calendarApi.getCalendarEvents(from, to),
  });
}
