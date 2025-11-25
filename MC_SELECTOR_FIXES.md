# MC Selector Fixes

## Issues Fixed

### 1. **Two MC Selectors Problem**
- **Issue**: Both `CompanySwitcher` (sidebar) and `McViewSelector` (header) were handling MC selection
- **Solution**: `McViewSelector` in header is now the primary selector. `CompanySwitcher` can remain for company switching but MC functionality is handled by `McViewSelector`

### 2. **Selection Not Persisting**
- **Issue**: When selecting "All MCs" or a different MC, the selection didn't show as selected
- **Fix**: 
  - Added cookie reading on component mount
  - State now syncs with cookies (`currentMcNumberId`, `currentMcNumber`, `selectedMcNumberIds`, `mcViewMode`)
  - State updates when selection changes

### 3. **"Select Multiple" Popover Closing Immediately**
- **Issue**: Popover opened then immediately closed
- **Fix**:
  - Added `onSelect` handler with `e.preventDefault()` to prevent Select from closing
  - Popover now stays open when "Select Multiple" is clicked
  - Added `onInteractOutside` handler to prevent accidental closing

### 4. **MC Selection Not Working**
- **Issue**: Selecting a different MC didn't change the selection
- **Fix**:
  - Fixed state management to update `currentMcId` and `currentMcNumber` when selection changes
  - Fixed `viewMode` to properly reflect current state ('all', 'filtered', 'assigned')
  - API now sets cookies correctly with `viewMode: 'filtered'` instead of `'current'`

## Changes Made

### `components/mc-numbers/McViewSelector.tsx`
1. Added state management for reading from cookies
2. Added `useEffect` to sync with cookies on mount
3. Fixed state updates in all handler functions
4. Fixed Select value to show current selection correctly
5. Fixed popover to stay open when "Select Multiple" is clicked

### `app/api/mc-numbers/set-view/route.ts`
1. Changed `viewMode` from `'current'` to `'filtered'` for single MC selection
2. Ensures cookies are set correctly for all view modes

## How It Works Now

1. **Component Mount**: Reads MC state from cookies
2. **Select "All MCs"**: 
   - Calls API to set cookies
   - Updates state to `viewMode: 'all'`
   - Shows "All MCs" in selector
3. **Select Single MC**:
   - Calls API with `mcNumberId`
   - Updates state with selected MC
   - Shows "MC {number}" in selector
4. **Select Multiple MCs**:
   - Clicking "Select Multiple" opens popover (doesn't close Select)
   - User selects MCs via checkboxes
   - Clicking "Apply" calls API with `mcNumberIds` array
   - Shows "{X} MCs" in selector

## Testing Checklist

- [ ] Select "All MCs" - should show as selected
- [ ] Select a single MC - should show MC number
- [ ] Select "Select Multiple" - popover should stay open
- [ ] Select multiple MCs and apply - should show count
- [ ] Refresh page - selection should persist
- [ ] Switch between modes - should work smoothly

## Notes

- The `CompanySwitcher` in sidebar still has MC functionality but `McViewSelector` in header is the primary interface
- Both can coexist but they may conflict - consider removing MC functionality from `CompanySwitcher` if issues persist
- Cookies are the source of truth for MC selection state

