'use client';

import { useMcSelection } from '@/lib/contexts/McSelectionContext';

/**
 * Hook to get the current MC selection for use in React Query query keys
 * This ensures queries refetch when MC selection changes
 * 
 * @example
 * const { selectedMcId } = useMcSelection();
 * const queryKey = ['loads', selectedMcId, page];
 */
export function useMcQueryKey() {
  const { selectedMcId } = useMcSelection();
  
  // Return the MC ID for use in query keys
  // null means "All Companies"
  return selectedMcId;
}

/**
 * Helper to build query keys that include MC selection
 * This ensures queries automatically refetch when MC changes
 * 
 * @example
 * const mcKey = useMcQueryKey();
 * const queryKey = buildMcQueryKey(['loads', page], mcKey);
 */
export function buildMcQueryKey(baseKey: (string | number)[], mcKey: string | null): (string | number | null)[] {
  return [...baseKey, mcKey];
}



