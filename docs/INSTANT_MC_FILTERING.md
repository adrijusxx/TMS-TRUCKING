# Instant MC Filtering - Zero Refetching

This is the **best solution** for smooth MC filtering with **zero UI flashing** and **instant updates**.

## How It Works

Instead of refetching data when MC changes, we:
1. **Fetch ALL data once** (no MC filtering in API call)
2. **Filter client-side instantly** when MC changes
3. **No API calls** during MC switch
4. **No loading states** - filtering is instant
5. **No URL changes** - everything stays the same

## Key Difference

### ❌ Old Approach (Refetching)
```
MC Changes → API Call → Loading State → New Data → UI Update
(Feels slow, shows loading spinners)
```

### ✅ New Approach (Client-Side Filtering)
```
MC Changes → Instant Filter → UI Update
(Instant, no loading, no flashing)
```

## Usage

### Step 1: Use the Hook

Replace your `useQuery` with `useClientSideMcFilter`:

```tsx
import { useClientSideMcFilter } from '@/hooks/useClientSideMcFilter';

function LoadsList() {
  // Fetch ALL loads once (no MC in query key)
  const { filteredData, allData, isLoading } = useClientSideMcFilter({
    queryKey: ['loads'], // No MC here - fetches all data
    queryFn: async () => {
      const response = await fetch('/api/loads?limit=1000');
      return response.json();
    },
  });

  // filteredData is automatically filtered by selected MC
  // Updates INSTANTLY when MC changes - no API call!
  
  return (
    <div>
      {filteredData.map(load => (
        <LoadItem key={load.id} load={load} />
      ))}
    </div>
  );
}
```

### Step 2: Extract MC Number (if needed)

If your items don't have `mcNumber` directly:

```tsx
const { filteredData } = useClientSideMcFilter({
  queryKey: ['loads'],
  queryFn: fetchLoads,
  // Extract MC number from nested object
  getMcNumber: (load) => load.driver?.mcNumber || load.mcNumber,
});
```

## Complete Example

```tsx
'use client';

import { useClientSideMcFilter } from '@/hooks/useClientSideMcFilter';
import { McSelectCombobox } from '@/components/mc-numbers/McSelectCombobox';
import { apiUrl } from '@/lib/utils';

export function LoadsList() {
  const { filteredData, allData, isLoading } = useClientSideMcFilter({
    queryKey: ['loads'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/loads?limit=1000'));
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <McSelectCombobox />
      <p>Showing {filteredData.length} of {allData.length} loads</p>
      {filteredData.map(load => (
        <LoadItem key={load.id} load={load} />
      ))}
    </div>
  );
}
```

## Benefits

✅ **Instant Updates** - Filtering happens in memory, no API delay  
✅ **No Loading States** - No spinners during MC switch  
✅ **No UI Flashing** - Data doesn't disappear/reappear  
✅ **Better Performance** - One API call instead of many  
✅ **Smooth UX** - Feels instant and responsive  
✅ **No URL Changes** - URL stays clean  

## When to Use

### ✅ Use Client-Side Filtering When:
- Data fits in memory (reasonable dataset size)
- MC filtering is the main filter
- You want instant updates
- You have pagination handled separately

### ⚠️ Consider Refetching When:
- Dataset is very large (10k+ items)
- You need server-side filtering for performance
- MC filter is combined with complex server-side filters

## Migration Guide

### Before (Refetching):
```tsx
import { useQuery } from '@tanstack/react-query';
import { useMcQueryKey } from '@/hooks/useMcQueryKey';

const mcKey = useMcQueryKey();
const { data, isLoading } = useQuery({
  queryKey: ['loads', mcKey], // Refetches when MC changes
  queryFn: fetchLoads,
});
```

### After (Client-Side Filtering):
```tsx
import { useClientSideMcFilter } from '@/hooks/useClientSideMcFilter';

const { filteredData, isLoading } = useClientSideMcFilter({
  queryKey: ['loads'], // No MC - fetches all once
  queryFn: fetchLoads,
});
```

## Performance Tips

1. **Limit Initial Fetch**: Use `limit=1000` or pagination
2. **Cache Data**: React Query caches the data automatically
3. **Background Refresh**: Data refreshes in background after 5 minutes
4. **Memory Efficient**: Only filtered data is rendered

## Advanced: Combining with Other Filters

You can combine client-side MC filtering with other filters:

```tsx
const { filteredData } = useClientSideMcFilter({
  queryKey: ['loads'],
  queryFn: fetchLoads,
});

// Apply additional client-side filters
const statusFiltered = filteredData.filter(load => 
  load.status === 'ACTIVE'
);

// Or combine with search
const searchFiltered = statusFiltered.filter(load =>
  load.loadNumber.includes(searchQuery)
);
```

## Troubleshooting

### Data Not Filtering?

1. **Check MC Number Format**: Ensure `mcNumber` matches exactly (trim whitespace)
2. **Verify getMcNumber**: If using custom extractor, verify it returns correct value
3. **Check Selected MC**: Verify `selectedMc.mcNumber` is set correctly

### Performance Issues?

1. **Limit Data**: Reduce initial fetch limit
2. **Use Pagination**: Implement pagination for large datasets
3. **Memoize Filters**: Use `useMemo` for expensive filters

## Summary

This approach gives you:
- ⚡ **Instant filtering** - No API delays
- 🎯 **Zero flashing** - No UI updates
- 🚀 **Better UX** - Feels instant and smooth
- 📦 **Efficient** - One API call, multiple filters

Try it and see the difference!

