'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMcFilter } from '@/lib/contexts/McFilterContext';

/**
 * Hook for client-side MC filtering - NO REFETCHING, instant filtering
 * Fetches data once, then filters client-side when MC changes
 * 
 * @example
 * const { filteredData, allData, isLoading } = useClientSideMcFilter({
 *   queryKey: ['loads'],
 *   queryFn: fetchLoads,
 *   getMcNumber: (item) => item.mcNumber, // Extract MC number from item
 * });
 */
export function useClientSideMcFilter<TData extends { mcNumber?: string | null }>(options: {
  queryKey: (string | number)[];
  queryFn: () => Promise<{ data?: TData[] }>;
  getMcNumber?: (item: TData) => string | null | undefined;
}) {
  const { filterByMc } = useMcFilter();
  
  // Fetch ALL data once (no MC filtering in query key)
  const { data, isLoading, error } = useQuery({
    queryKey: options.queryKey, // No MC in key - fetches all data
    queryFn: async () => {
      const result = await options.queryFn();
      return result;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    // Keep previous data visible
    placeholderData: (previousData) => previousData,
  });

  // Filter data client-side - INSTANT, no API call
  const filteredData = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return [];
    
    const items = data.data as TData[];
    
    // If getMcNumber is provided, use it to extract MC number
    if (options.getMcNumber) {
      const itemsWithMc = items.map((item) => ({
        ...item,
        mcNumber: options.getMcNumber!(item) || null,
      }));
      return filterByMc(itemsWithMc as TData[]);
    }
    
    // Otherwise, assume items have mcNumber property
    return filterByMc(items);
  }, [data, filterByMc, options.getMcNumber]);

  return {
    filteredData,
    allData: data?.data || [],
    isLoading,
    error,
    // Original query data
    data,
  };
}

