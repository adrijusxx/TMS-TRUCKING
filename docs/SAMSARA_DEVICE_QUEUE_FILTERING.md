# Samsara Device Queue - Advanced Filtering System

**Created:** December 5, 2025  
**Feature:** Comprehensive filtering for SamsaraDeviceQueue

## Overview

The `SamsaraDeviceQueue` now supports **advanced filtering** to help you quickly find specific devices that need review/approval before linking to your TMS.

## Available Filters

### Basic Filters (Always Visible)
1. **Search** - Search across:
   - Device name
   - VIN
   - License plate
   - *Example: "ABC-123" or "1HGBH41JXMN109186"*

2. **Device Type** - Filter by:
   - All Types
   - 🚛 Trucks
   - 🚚 Trailers

3. **Status** (via tabs/buttons in UI):
   - PENDING - New devices waiting for review
   - APPROVED - Devices approved, ready to create TMS records
   - LINKED - Devices successfully linked to TMS records
   - REJECTED - Devices rejected (won't be added to TMS)

### Advanced Filters (In Popover)
4. **Make** - Filter by vehicle manufacturer
   - *Example: "Freightliner", "Volvo", "Kenworth"*

5. **Model** - Filter by vehicle model
   - *Example: "Cascadia", "VNL", "T680"*

6. **Year Range** - Filter by manufacturing year
   - **Min Year** (e.g., 2020)
   - **Max Year** (e.g., 2024)
   - *Example: Show only devices from 2020-2024*

7. **Created Date Range** - When device was added to queue
   - **From Date**
   - **To Date**
   - *Example: Show devices discovered in last 7 days*

8. **Reviewed By** (API only, add to UI if needed)
   - Filter by the user who reviewed the device

## API Usage

### GET Endpoint

```typescript
GET /api/fleet/device-queue?<filters>
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Device status | `PENDING` |
| `deviceType` | string | TRUCK or TRAILER | `TRUCK` |
| `search` | string | Search name, VIN, plate | `ABC-123` |
| `make` | string | Vehicle make | `Freightliner` |
| `model` | string | Vehicle model | `Cascadia` |
| `yearMin` | number | Minimum year | `2020` |
| `yearMax` | number | Maximum year | `2024` |
| `createdFrom` | string | ISO date (from) | `2025-12-01` |
| `createdTo` | string | ISO date (to) | `2025-12-31` |
| `reviewedById` | string | User ID | `cuid123...` |
| `page` | number | Page number | `1` |
| `pageSize` | number | Items per page | `50` |

### Example Request

```bash
# Find all pending Freightliner trucks from 2020-2024
GET /api/fleet/device-queue?status=PENDING&deviceType=TRUCK&make=Freightliner&yearMin=2020&yearMax=2024

# Search for specific VIN
GET /api/fleet/device-queue?search=1HGBH41JXMN109186

# Find devices created in last 7 days
GET /api/fleet/device-queue?createdFrom=2025-11-28&createdTo=2025-12-05
```

### Response Structure

```typescript
{
  success: true,
  data: {
    items: [...], // Array of queue items
    pagination: {
      page: 1,
      pageSize: 50,
      total: 123,
      totalPages: 3
    },
    counts: {
      pending: 45,
      approved: 12,
      linked: 56,
      rejected: 10
    },
    filterOptions: {
      makes: ["Freightliner", "Volvo", "Kenworth"],
      models: ["Cascadia", "VNL", "T680"],
      years: [2024, 2023, 2022, 2021, 2020]
    }
  }
}
```

## React Component Usage

### Basic Usage

```tsx
'use client';

import { useState } from 'react';
import { DeviceQueueFiltersComponent, DeviceQueueFilters } from '@/components/fleet/DeviceQueueFilters';

export default function DeviceQueuePage() {
  const [filters, setFilters] = useState<DeviceQueueFilters>({
    status: 'PENDING',
  });

  const handleFiltersChange = (newFilters: DeviceQueueFilters) => {
    setFilters(newFilters);
    // Fetch data with new filters
    fetchDevices(newFilters);
  };

  return (
    <div>
      <DeviceQueueFiltersComponent
        filters={filters}
        onChange={handleFiltersChange}
        filterOptions={data?.filterOptions}
      />
      {/* Device list/table */}
    </div>
  );
}
```

### With Data Fetching

```tsx
'use client';

import { useState, useEffect } from 'react';
import { DeviceQueueFiltersComponent } from '@/components/fleet/DeviceQueueFilters';

export default function DeviceQueuePage() {
  const [filters, setFilters] = useState({ status: 'PENDING' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [filters]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/fleet/device-queue?${params}`);
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <DeviceQueueFiltersComponent
        filters={filters}
        onChange={setFilters}
        filterOptions={data?.filterOptions}
      />
      {/* Device list */}
    </div>
  );
}
```

## Use Cases

### 1. Review Only New Devices
```typescript
// Show devices added in last 24 hours
{
  status: 'PENDING',
  createdFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
}
```

### 2. Find Specific Truck by VIN
```typescript
// Quick search by VIN
{
  search: '1HGBH41JXMN109186',
  deviceType: 'TRUCK'
}
```

### 3. Review Only Modern Trucks
```typescript
// 2020+ Freightliner Cascadia trucks
{
  status: 'PENDING',
  deviceType: 'TRUCK',
  make: 'Freightliner',
  model: 'Cascadia',
  yearMin: 2020
}
```

### 4. Audit Approved Devices
```typescript
// See what was approved last month
{
  status: 'APPROVED',
  createdFrom: '2025-11-01',
  createdTo: '2025-11-30'
}
```

## Active Filter Display

The component automatically shows active filters as **removable badges**:

```
🔍 Search: "Freightliner"  [x]
🏷️ Type: TRUCK  [x]
📅 Year ≥ 2020  [x]
📅 Year ≤ 2024  [x]
```

Click the `[x]` on any badge to remove that filter.

## Performance Considerations

### Indexed Fields
The following filters use database indexes for fast querying:
- ✅ `companyId` (always filtered)
- ✅ `status`
- ✅ `deviceType`
- ✅ `samsaraId`

### Non-Indexed Fields
These filters may be slower on large datasets:
- ⚠️ `make`, `model` (text search)
- ⚠️ `year` (range query)
- ⚠️ `search` (OR query across 3 fields)

**Recommendation:** If you have 1000+ devices in queue, consider adding indexes:

```sql
CREATE INDEX "SamsaraDeviceQueue_make_idx" ON "SamsaraDeviceQueue"("make");
CREATE INDEX "SamsaraDeviceQueue_model_idx" ON "SamsaraDeviceQueue"("model");
CREATE INDEX "SamsaraDeviceQueue_year_idx" ON "SamsaraDeviceQueue"("year");
```

## Multi-MC Safety

✅ **Safe**: All queries automatically include `companyId` filter from session.
- Users can only see devices from their own company
- MC filtering is handled at the company level
- No cross-company data leakage possible

## Future Enhancements

Potential additions based on user feedback:
1. **Reviewer Filter** (UI dropdown)
2. **Bulk Actions** (approve/reject multiple)
3. **Saved Filter Presets** (e.g., "New Trucks This Week")
4. **Export Filtered Results** (CSV/Excel)
5. **Smart Suggestions** (e.g., "3 Freightliners match existing TMS records")

## Related Files

- API: `app/api/fleet/device-queue/route.ts`
- Component: `components/fleet/DeviceQueueFilters.tsx`
- Service: `lib/services/SamsaraDeviceSyncService.ts`
- Schema: `prisma/schema.prisma` (SamsaraDeviceQueue model)



