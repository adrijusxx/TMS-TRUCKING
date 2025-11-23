# MC Select Component - No URL Changes

This document explains the new MC (Motor Carrier) selection component that works without changing URLs or refreshing the page.

## Overview

The new `McSelectCombobox` component provides a clean, Mantine-style combobox for selecting MC numbers. When an MC is selected:

- ✅ **No URL changes** - The URL stays the same
- ✅ **No page refresh** - Smooth, instant updates
- ✅ **Automatic data refresh** - All React Query queries automatically refetch with the new MC filter
- ✅ **Persistent selection** - Selection persists across navigation

## Architecture

### Components

1. **`McSelectionProvider`** - Context provider that manages MC selection state
2. **`McSelectCombobox`** - The UI component (Mantine-style combobox)
3. **`useMcSelection`** - Hook to access MC selection state
4. **`useMcQueryKey`** - Hook to include MC in React Query keys

### How It Works

1. **State Management**: MC selection is stored in React Context (client-side only)
2. **Cookie Sync**: When MC changes, cookies are updated (for API routes to read)
3. **Query Invalidation**: All React Query queries are invalidated, causing automatic refetch
4. **API Filtering**: API routes read from cookies (via `McStateManager`) to filter data

## Usage

### Basic Usage

Replace the existing `CompanySwitcher` with `McSelectCombobox`:

```tsx
import { McSelectCombobox } from '@/components/mc-numbers/McSelectCombobox';

// In your layout or sidebar:
<McSelectCombobox />
```

### Using MC Selection in Components

```tsx
import { useMcSelection } from '@/lib/contexts/McSelectionContext';

function MyComponent() {
  const { selectedMc, selectedMcId, mcOptions } = useMcSelection();
  
  return (
    <div>
      <p>Selected MC: {selectedMc?.name || 'All Companies'}</p>
      <p>MC ID: {selectedMcId || 'null (all)'}</p>
    </div>
  );
}
```

### Including MC in React Query Keys

To ensure queries refetch when MC changes, include the MC selection in your query keys:

```tsx
import { useQuery } from '@tanstack/react-query';
import { useMcQueryKey } from '@/hooks/useMcQueryKey';

function LoadsList() {
  const mcKey = useMcQueryKey();
  
  const { data } = useQuery({
    queryKey: ['loads', mcKey, page], // MC key included
    queryFn: () => fetchLoads(page),
  });
  
  // Query automatically refetches when MC changes
}
```

### Manual Data Refresh

If you need to manually refresh data after MC selection:

```tsx
import { useMcSelection } from '@/lib/contexts/McSelectionContext';

function MyComponent() {
  const { refreshData } = useMcSelection();
  
  const handleSomething = () => {
    // Do something...
    refreshData(); // Refresh all queries
  };
}
```

## Integration with Existing Code

### Option 1: Replace CompanySwitcher

Replace `CompanySwitcher` in `components/layout/DashboardLayout.tsx`:

```tsx
// Before:
import CompanySwitcher from '@/components/layout/CompanySwitcher';
<CompanySwitcher />

// After:
import { McSelectCombobox } from '@/components/mc-numbers/McSelectCombobox';
<McSelectCombobox />
```

### Option 2: Use Both Components

You can use both components side-by-side if needed:

```tsx
<div className="space-y-2">
  <McSelectCombobox />
  <CompanySwitcher /> {/* Keep for URL-based navigation if needed */}
</div>
```

## API Integration

The component sets cookies that API routes read via `McStateManager`:

- `currentMcNumberId` - Selected MC ID
- `currentMcNumber` - Selected MC number value
- `mcViewMode` - "all" when "All Companies" is selected

API routes automatically filter data based on these cookies, so no changes are needed to existing API routes.

## Styling

The component uses Tailwind CSS classes and matches your existing design system:

- Dark mode support
- Slate color scheme
- Responsive design
- Accessible (ARIA roles, keyboard navigation)

## Example: Complete Integration

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useMcQueryKey } from '@/hooks/useMcQueryKey';
import { McSelectCombobox } from '@/components/mc-numbers/McSelectCombobox';
import { apiUrl } from '@/lib/utils';

function LoadsPage() {
  const mcKey = useMcQueryKey();
  const page = 1;
  
  const { data, isLoading } = useQuery({
    queryKey: ['loads', mcKey, page],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/loads?page=${page}`));
      return response.json();
    },
  });
  
  return (
    <div>
      <div className="mb-4">
        <McSelectCombobox />
      </div>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {/* Your loads list */}
        </div>
      )}
    </div>
  );
}
```

## Smooth Transitions (No UI Flashing)

The component is optimized to prevent UI flashing when MC changes:

- ✅ **Placeholder Data**: Previous data stays visible while new data loads
- ✅ **Active Queries Only**: Only refetches queries visible on screen
- ✅ **Non-blocking**: Uses React transitions for smooth updates
- ✅ **No Loading States**: Components don't show loading spinners during MC switch
- ✅ **Instant Feedback**: MC selection updates immediately

### Using Smooth Queries

For the smoothest experience, use `useSmoothMcQuery` instead of regular `useQuery`:

```tsx
import { useSmoothMcQuery } from '@/hooks/useSmoothMcQuery';

function LoadsList() {
  const { data, isLoading } = useSmoothMcQuery({
    queryKey: ['loads', page],
    queryFn: () => fetchLoads(page),
  });
  
  // Data transitions smoothly - no flashing!
}
```

## Benefits

1. **Better UX**: No page refreshes or URL changes
2. **Faster**: Instant MC switching with smooth transitions
3. **Clean URLs**: URLs stay clean and shareable
4. **Automatic**: Queries automatically refetch when MC changes
5. **Compatible**: Works with existing API routes via cookies
6. **Smooth**: No UI flashing - previous data stays visible during refetch

## Migration Notes

- The component is already integrated into `app/layout.tsx` via `McSelectionProvider`
- No changes needed to API routes (they already read from cookies)
- Existing `CompanySwitcher` can be kept or replaced
- Both systems can coexist if needed

