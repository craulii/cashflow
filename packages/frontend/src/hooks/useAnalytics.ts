import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';

export function useDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
  });
}

export function useMonthlyAnalytics(year?: number, month?: number) {
  return useQuery({
    queryKey: ['analytics', 'monthly', year, month],
    queryFn: () => analyticsApi.getMonthly(year, month),
  });
}

export function useComparison(months?: number) {
  return useQuery({
    queryKey: ['analytics', 'comparison', months],
    queryFn: () => analyticsApi.getComparison(months),
  });
}

export function useTrends(months?: number) {
  return useQuery({
    queryKey: ['analytics', 'trends', months],
    queryFn: () => analyticsApi.getTrends(months),
  });
}
