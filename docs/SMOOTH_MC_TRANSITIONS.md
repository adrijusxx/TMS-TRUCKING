# Smooth MC Transitions - No UI Flashing

This guide explains how to ensure smooth transitions when MC selection changes, preventing UI flashing and loading states.

## The Problem

When MC selection changes, all queries refetch. Without proper handling, this causes:
- ❌ UI flashing (data disappears/reappears)
- ❌ Loading spinners everywhere
- ❌ Poor user experience

## The Solution

We've implemented several optimizations:

### 1. Placeholder Data

React Query keeps previous data visible while new data loads:

```tsx
// In QueryProvider - already configured
placeholderData: (previousData) => previousData
```

### 2. Active Queries Only

Only refetch queries visible on screen:

```tsx
queryClient.refetchQueries({
  refetchType: 'active', // Only active queries
  cancelRefetch: false, // Don't cancel ongoing requests
});
```

### 3. React Transitions

MC selection uses React's `startTransition` for non-urgent updates:

```tsx
startTransition(() => {
  setSelectedMc(mcId);
});
```

### 4. Smooth Query Hook

Use `useSmoothMcQuery` for automatic smooth transitions:

```tsx
import { useSmoothMcQuery } from '@/hooks/useSmoothMcQuery';

function MyComponent() {
  const { data, isLoading } = useSmoothMcQuery({
    queryKey: ['loads', page],
    queryFn: () => fetchLoads(page),
  });
  
  // Previous data stays visible while new data loads
  // No loading spinner during MC switch
}
```

## Best Practices

### ✅ DO: Use Smooth Query Hook

```tsx
import { useSmoothMcQuery } from '@/hooks/useSmoothMcQuery';

const { data } = useSmoothMcQuery({
  queryKey: ['loads'],
  queryFn: fetchLoads,
});
```

### ✅ DO: Include MC in Query Keys

```tsx
import { useMcQueryKey } from '@/hooks/useMcQueryKey';

const mcKey = useMcQueryKey();
const { data } = useQuery({
  queryKey: ['loads', mcKey], // Auto-refetches when MC changes
  queryFn: fetchLoads,
});
```

### ✅ DO: Use Placeholder Data

```tsx
const { data } = useQuery({
  queryKey: ['loads'],
  queryFn: fetchLoads,
  placeholderData: (previousData) => previousData, // Keep old data visible
});
```

### ❌ DON'T: Show Loading States During MC Switch

```tsx
// Bad - shows loading spinner during MC switch
const { data, isLoading } = useQuery({
  queryKey: ['loads'],
  queryFn: fetchLoads,
});

if (isLoading) return <LoadingSpinner />; // ❌ Flashes during MC switch
```

### ❌ DON'T: Invalidate All Queries

```tsx
// Bad - causes all queries to refetch
queryClient.invalidateQueries(); // ❌ Too aggressive
```

## Migration Guide

### Step 1: Replace useQuery with useSmoothMcQuery

**Before:**
```tsx
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['loads'],
  queryFn: fetchLoads,
});
```

**After:**
```tsx
import { useSmoothMcQuery } from '@/hooks/useSmoothMcQuery';

const { data } = useSmoothMcQuery({
  queryKey: ['loads'],
  queryFn: fetchLoads,
});
```

### Step 2: Update Loading States

**Before:**
```tsx
if (isLoading) {
  return <LoadingSpinner />;
}
```

**After:**
```tsx
// Show loading only on initial load, not during MC switch
if (isLoading && !data) {
  return <LoadingSpinner />;
}

// Data is always available (from placeholderData)
return <DataDisplay data={data} />;
```

### Step 3: Check isRefreshing for MC Switch

```tsx
import { useMcSelection } from '@/lib/contexts/McSelectionContext';

function MyComponent() {
  const { isRefreshing } = useMcSelection();
  const { data, isLoading } = useSmoothMcQuery({
    queryKey: ['loads'],
    queryFn: fetchLoads,
  });
  
  // Show loading only on initial load
  if (isLoading && !data) {
    return <LoadingSpinner />;
  }
  
  // Optional: Show subtle indicator during MC switch
  return (
    <div>
      {isRefreshing && (
        <div className="text-xs text-muted-foreground">
          Updating data...
        </div>
      )}
      <DataDisplay data={data} />
    </div>
  );
}
```

## Technical Details

### How It Works

1. **MC Selection Changes**: User selects new MC
2. **State Updates**: MC selection updates immediately (instant feedback)
3. **Cookie Set**: Cookie is set for API routes
4. **Queries Refetch**: Only active queries refetch in background
5. **Placeholder Data**: Previous data stays visible during refetch
6. **New Data Arrives**: New data replaces old data smoothly

### Performance

- **No Blocking**: Uses `requestAnimationFrame` for smooth scheduling
- **Batched Updates**: React batches state updates
- **Selective Refetch**: Only active queries refetch
- **No Cancellation**: Ongoing requests complete normally

## Troubleshooting

### Still Seeing Flashing?

1. **Check Query Keys**: Make sure MC is included in query keys
2. **Use Smooth Hook**: Use `useSmoothMcQuery` instead of `useQuery`
3. **Check Loading States**: Don't show loading when data exists
4. **Verify Placeholder**: Ensure `placeholderData` is configured

### Queries Not Refetching?

1. **Include MC Key**: Add MC to query keys using `useMcQueryKey()`
2. **Check Active**: Make sure query is active (visible on screen)
3. **Verify Cookies**: Check that cookies are being set correctly

### Performance Issues?

1. **Limit Queries**: Only refetch active queries
2. **Debounce**: Already handled by `requestAnimationFrame`
3. **Cache**: React Query cache prevents unnecessary refetches

