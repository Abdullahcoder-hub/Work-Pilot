import { useQuery } from '@tanstack/react-query';
import * as reportsApi from './reportsApi';

export function useReportsOverview() {
  return useQuery({ queryKey: ['reports', 'overview'], queryFn: reportsApi.getOverview, staleTime: 60_000 });
}
