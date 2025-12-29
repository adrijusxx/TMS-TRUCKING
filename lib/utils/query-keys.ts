/**
 * Query key utilities for React Query
 * Normalizes query keys to include MC context for proper cache invalidation
 */

/**
 * Gets the current MC context from cookies/localStorage for query key normalization
 */
export function getMcContext(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  // Check for multi-MC mode
  const selectedIdsCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('selectedMcNumberIds='));
  
  if (selectedIdsCookie) {
    try {
      const ids = JSON.parse(decodeURIComponent(selectedIdsCookie.split('=')[1]));
      if (Array.isArray(ids) && ids.length > 0) {
        return `multi:${ids.sort().join(',')}`;
      }
    } catch {
      // Invalid cookie, fall through
    }
  }

  // Check for single MC
  const mcNumberId = document.cookie
    .split('; ')
    .find((row) => row.startsWith('currentMcNumberId='))
    ?.split('=')[1];

  if (mcNumberId) {
    return `mc:${mcNumberId}`;
  }

  // Check for "all MCs" mode
  const viewMode = document.cookie
    .split('; ')
    .find((row) => row.startsWith('mcViewMode='))
    ?.split('=')[1];

  if (viewMode === 'all') {
    return 'all';
  }

  return 'current';
}

/**
 * Creates a normalized query key with MC context
 * @param baseKey - Base query key (e.g., ['loads'])
 * @param params - Additional query parameters
 * @returns Normalized query key array
 */
function createQueryKey(
  baseKey: string | string[],
  params?: Record<string, any>
): any[] {
  const base = Array.isArray(baseKey) ? baseKey : [baseKey];
  const mcContext = getMcContext();
  
  const key = [...base, mcContext];
  
  if (params) {
    // Sort params for consistent keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, k) => {
        acc[k] = params[k];
        return acc;
      }, {} as Record<string, any>);
    
    key.push(JSON.stringify(sortedParams));
  }
  
  return key;
}

/**
 * Invalidates queries with MC context
 * Use this instead of invalidateQueries() to ensure proper cache invalidation
 */
function invalidateMcQueries(
  queryClient: any,
  baseKey: string | string[],
  exact = false
): void {
  const base = Array.isArray(baseKey) ? baseKey : [baseKey];
  const mcContext = getMcContext();
  
  if (exact) {
    queryClient.invalidateQueries({ queryKey: [...base, mcContext], exact: true });
  } else {
    // Invalidate all variations of this query (different MC contexts)
    queryClient.invalidateQueries({ queryKey: base });
  }
}

