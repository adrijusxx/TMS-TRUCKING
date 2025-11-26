import type { ColumnFiltersState } from '@tanstack/react-table';

/**
 * Converts TanStack Table column filters to URL query parameters
 * Handles special cases like date ranges, number ranges, and multi-select
 */
export function convertFiltersToQueryParams(
  filters: ColumnFiltersState,
  search?: string
): URLSearchParams {
  const queryParams = new URLSearchParams();

  // Add search if provided
  if (search) {
    queryParams.set('search', search);
  }

  // Group filters by base key (handle _start, _end, _min, _max suffixes)
  const filterGroups = new Map<string, any>();

  filters.forEach((filter) => {
    if (!filter.id || filter.value === undefined || filter.value === null || filter.value === '') {
      return;
    }

    const id = filter.id;
    let value = filter.value;
    
    // Handle boolean values - convert to string 'true' or 'false'
    if (typeof value === 'boolean') {
      value = value ? 'true' : 'false';
    }
    
    // Handle date range filters (key_start, key_end)
    if (id.endsWith('_start')) {
      const baseKey = id.replace('_start', '');
      if (!filterGroups.has(baseKey)) {
        filterGroups.set(baseKey, { type: 'daterange', start: null, end: null });
      }
      filterGroups.get(baseKey)!.start = value;
      return;
    }

    if (id.endsWith('_end')) {
      const baseKey = id.replace('_end', '');
      if (!filterGroups.has(baseKey)) {
        filterGroups.set(baseKey, { type: 'daterange', start: null, end: null });
      }
      filterGroups.get(baseKey)!.end = value;
      return;
    }

    // Handle number range filters (key_min, key_max)
    if (id.endsWith('_min')) {
      const baseKey = id.replace('_min', '');
      if (!filterGroups.has(baseKey)) {
        filterGroups.set(baseKey, { type: 'numberrange', min: null, max: null });
      }
      filterGroups.get(baseKey)!.min = value;
      return;
    }

    if (id.endsWith('_max')) {
      const baseKey = id.replace('_max', '');
      if (!filterGroups.has(baseKey)) {
        filterGroups.set(baseKey, { type: 'numberrange', min: null, max: null });
      }
      filterGroups.get(baseKey)!.max = value;
      return;
    }

    // Handle regular filters (including multiselect JSON arrays)
    try {
      const parsed = JSON.parse(String(value));
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Multi-select: send each value as separate query param with same key
        parsed.forEach((val) => {
          queryParams.append(id, String(val));
        });
        return;
      }
    } catch {
      // Not JSON, treat as single value
    }

    // Store single value filter for later processing
    if (!filterGroups.has(id)) {
      filterGroups.set(id, { type: 'single', value: null });
    }
    filterGroups.get(id)!.value = value;
  });

  // Process grouped filters
  filterGroups.forEach((filterData, key) => {
    if (filterData.type === 'daterange') {
      // Date ranges: use startDate/endDate for loads API, or keyStart/keyEnd for others
      if (filterData.start) {
        // For loads API, always use startDate/endDate
        if (key === 'date' || key === 'pickupDate' || key === 'deliveryDate') {
          queryParams.set('startDate', String(filterData.start));
        } else {
          queryParams.set('startDate', String(filterData.start));
        }
      }
      if (filterData.end) {
        if (key === 'date' || key === 'pickupDate' || key === 'deliveryDate') {
          queryParams.set('endDate', String(filterData.end));
        } else {
          queryParams.set('endDate', String(filterData.end));
        }
      }
    } else if (filterData.type === 'numberrange') {
      // Number ranges: send as keyMin/keyMax or revenue (for loads)
      if (filterData.min !== undefined && filterData.min !== '') {
        if (key === 'revenue') {
          queryParams.set('revenue', String(filterData.min)); // API uses revenue as min
        } else {
          queryParams.set(`${key}Min`, String(filterData.min));
        }
      }
      if (filterData.max !== undefined && filterData.max !== '') {
        queryParams.set(`${key}Max`, String(filterData.max));
      }
    } else {
      // Single value filter - map key to API parameter name
      // Handle field name mappings (e.g., state -> licenseState for trucks)
      const apiParamName = getApiParamName(key);
      queryParams.set(apiParamName, String(filterData.value));
    }
  });

  return queryParams;
}

/**
 * Maps filter keys to API parameter names
 * Handles cases where frontend filter keys differ from API parameter names
 */
function getApiParamName(filterKey: string): string {
  // Most filter keys match API param names directly
  // Only add mappings when there's a mismatch
  const mappings: Record<string, string> = {
    // Add mappings here only when filter key differs from API param name
  };
  
  return mappings[filterKey] || filterKey;
}
