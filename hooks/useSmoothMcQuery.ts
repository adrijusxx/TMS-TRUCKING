'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useMcQueryKey } from './useMcQueryKey';

/**
 * Hook for smooth MC-filtered queries that don't flash when MC changes
 * Automatically includes MC selection in query key and uses placeholderData
 * 
 * @example
 * const { data, isLoading } = useSmoothMcQuery({
 *   queryKey: ['loads', page],
 *   queryFn: () => fetchLoads(page),
 * });
 */
export function useSmoothMcQuery<TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'placeholderData'> & {
    queryKey: (string | number)[];
  }
) {
  const mcKey = useMcQueryKey();
  
  // Include MC key in query key so queries refetch when MC changes
  const fullQueryKey = [...options.queryKey, mcKey];
  
  return useQuery<TData, TError>({
    ...options,
    queryKey: fullQueryKey,
    // Keep previous data visible while new data loads (prevents UI flashing)
    placeholderData: (previousData) => previousData,
    // Use stale data if available (makes transitions instant)
    staleTime: options.staleTime ?? 5 * 60 * 1000,
  });
}





