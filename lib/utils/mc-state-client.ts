/**
 * Client-side utility to read MC state from cookies
 * Use this instead of reading from URL searchParams
 */

export interface McStateFromCookies {
  mcId: string | null;
  mcNumber: string | null;
  viewMode: 'all' | 'filtered' | 'assigned' | null;
  selectedIds: string[];
}

/**
 * Gets MC state from cookies (client-side only)
 */
export function getMcStateFromCookies(): McStateFromCookies {
  if (typeof window === 'undefined') {
    return {
      mcId: null,
      mcNumber: null,
      viewMode: null,
      selectedIds: [],
    };
  }

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

  const mcId = getCookie('currentMcNumberId');
  const mcNumber = getCookie('currentMcNumber');
  const viewMode = getCookie('mcViewMode') as 'all' | 'filtered' | 'assigned' | null;
  const selectedIdsCookie = getCookie('selectedMcNumberIds');

  let selectedIds: string[] = [];
  if (selectedIdsCookie) {
    try {
      selectedIds = JSON.parse(decodeURIComponent(selectedIdsCookie));
    } catch {
      // Invalid cookie, ignore
    }
  }

  return {
    mcId,
    mcNumber: mcNumber ? decodeURIComponent(mcNumber) : null,
    viewMode,
    selectedIds: Array.isArray(selectedIds) ? selectedIds : [],
  };
}

/**
 * Gets MC parameter value for API calls (for backward compatibility)
 * Returns null if viewing all MCs, or the MC ID/array for filtering
 */
export function getMcParamForApi(): string | null {
  const state = getMcStateFromCookies();
  
  if (state.viewMode === 'all') {
    return null; // No MC filter
  }
  
  if (state.selectedIds.length > 0) {
    // Multi-MC - return first ID (API will handle array via cookies)
    return state.selectedIds[0];
  }
  
  return state.mcId;
}

