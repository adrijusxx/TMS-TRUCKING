# Unified Samsara Device Queue

**Created:** December 5, 2025  
**Location:** `/dashboard/fleet/devices`

## 🎯 Overview

**ONE unified page** with **TWO viewing modes** to handle Samsara device review:

1. **🎨 Smart Sections** - Auto-organized by confidence (new!)
2. **📊 Table + Select All** - Bulk actions with checkboxes (existing)

---

## 📍 How to Access

**Navigation:** Fleet Department → Samsara Devices  
**URL:** `http://localhost:3000/dashboard/fleet/devices`

---

## 🔄 Two Modes (Toggle at Top)

### Mode 1: **Smart Sections View** (Default)

**Best For:** Daily review, finding specific devices, understanding what needs attention

**Features:**
- ✅ **Auto-organized into 5 sections:**
  1. High Confidence Matches (Green) - Has VIN or complete info
  2. Complete Information (Blue) - Has Make/Model/Year
  3. Needs Review (Yellow) - Partial info
  4. **Unknown or Generic Names (Gray)** - "Vehicle 123", random numbers
  5. Missing Information (Red) - Lacks key fields

- 🔍 **Advanced Filters:**
  - Search by name, VIN, license plate
  - Filter by device type (Truck/Trailer)
  - Filter by Make, Model, Year range
  - Filter by created date range
  - Active filter badges (removable)

- 📦 **Collapsible Sections:**
  - Click to expand/collapse
  - Count badges on each section
  - High priority sections open by default
  - "Unknown/Generic" collapsed by default

- 🎯 **Individual Actions:**
  - ✅ Approve (create new TMS record)
  - 🔗 Link (connect to existing record)
  - ❌ Reject (mark as rejected)

**When to Use:**
- Daily review workflow
- Finding specific VIN or device
- Quickly see what's high priority vs. low priority
- Understanding why a device is flagged

---

### Mode 2: **Table + Select All View**

**Best For:** Bulk operations, mass approvals, spreadsheet-style review

**Features:**
- ☑️ **Select All Checkbox** - Select multiple devices at once
- 📋 **Table Format** - All devices in rows
- 🔄 **Bulk Actions:**
  - Approve selected devices (creates multiple TMS records)
  - Reject selected devices with reason
  - Clear selection
- 🔍 **Search & Filter** - Built into the table component
- 📊 **Status Tabs** - Pending, Approved, Linked, Rejected

**When to Use:**
- You have 20+ devices to review
- Most devices are "obvious" approvals
- Want to quickly approve all Freightliners
- Need to bulk reject test devices

---

## 🎮 How to Use

### Scenario 1: Daily Review (Use Smart Sections)
```
1. Go to Fleet → Samsara Devices
2. Ensure "Smart Sections" is selected (default)
3. Review "High Confidence" section first (green)
4. Click ✅ Approve on each device
5. Review "Complete Information" section (blue)
6. Ignore "Unknown or Generic Names" (collapsed)
```

### Scenario 2: Bulk Approve 50 Devices (Use Table)
```
1. Go to Fleet → Samsara Devices
2. Click "Table + Select All" button
3. Check "Select All" checkbox at top
4. (Optional) Uncheck devices you want to skip
5. Click "Approve Selected" button
6. Done! All selected devices → TMS records
```

### Scenario 3: Find Specific Device (Use Smart Sections with Filters)
```
1. Go to Fleet → Samsara Devices  
2. Ensure "Smart Sections" is selected
3. Search: "1HGBH41JXMN109186" (VIN)
   - OR -
   Filter: Make = "Freightliner", Year >= 2020
4. Device appears in appropriate section
5. Click action button (Approve/Link/Reject)
```

### Scenario 4: Clean Up Random Names (Use Smart Sections)
```
1. Go to Fleet → Samsara Devices
2. Ensure "Smart Sections" is selected
3. Expand "Unknown or Generic Names" section (gray)
4. See devices like "Vehicle 123", "Truck 456"
5. Reject these with reason: "Generic name - needs rename in Samsara"
6. Notify Samsara admin to rename devices properly
```

---

## 🔧 View Mode Preference

Your choice is **saved automatically**:
- Switch to "Table" → Next visit remembers "Table"
- Switch to "Smart Sections" → Next visit remembers "Smart Sections"

Stored in browser localStorage per user.

---

## ⚡ Quick Actions Bar

Available in both modes:

- **🔄 Refresh** - Reload device list
- **🔁 Sync from Samsara** - Pull latest devices from Samsara API

---

## 📊 Right Sidebar (Both Modes)

**Fleet Fault Summary** - Shows active diagnostic faults across fleet
- Critical faults requiring attention
- Warning level faults
- Device health overview

---

## 🎯 When to Use Which Mode?

| Situation | Recommended Mode |
|-----------|------------------|
| Daily review (5-20 devices) | **Smart Sections** |
| Bulk approve (50+ devices) | **Table + Select All** |
| Finding specific VIN | **Smart Sections** (use search) |
| Understanding device quality | **Smart Sections** (see confidence) |
| Filtering by make/model | **Smart Sections** (advanced filters) |
| Quick mass rejection | **Table + Select All** |
| Learning which devices are "random" | **Smart Sections** (see "Unknown" section) |
| Spreadsheet-style work | **Table + Select All** |

---

## 🔑 Key Differences

### Smart Sections View:
- ✅ Shows WHY device is in each group
- ✅ Confidence badges (High Match, Good Info, etc.)
- ✅ Advanced filters (Make, Model, Year, Date)
- ✅ Collapsible sections reduce clutter
- ❌ No bulk select (one at a time)

### Table View:
- ✅ Select all checkbox
- ✅ Bulk approve/reject
- ✅ Familiar table format
- ✅ Fast for mass operations
- ❌ No smart organization
- ❌ No confidence indicators

---

## 🛡️ Multi-MC Safety

✅ **Safe in both modes:**
- All queries filtered by `companyId`
- Users only see their company's devices
- Cannot approve/link other companies' devices

---

## 📝 Related Files

- Page: `app/dashboard/fleet/devices/page.tsx`
- Unified Component: `components/fleet/UnifiedDeviceQueue.tsx`
- Smart Sections: `components/fleet/DeviceQueueSections.tsx`
- Filters: `components/fleet/DeviceQueueFilters.tsx`
- Table: `components/fleet/SamsaraDeviceQueue.tsx`
- API: `app/api/fleet/device-queue/route.ts`

---

## 💡 Pro Tips

1. **Start with Smart Sections** to understand your queue
2. **Switch to Table** when you're ready for bulk actions
3. **Use filters** in Smart Sections to narrow down
4. **Ignore "Unknown" section** until you have time to clean up
5. **Bookmark the page** - You'll use it daily!

---

## 🆕 What's New?

**Before:** Only had table view  
**After:** Two modes - Smart Sections (organized) + Table (bulk actions)

**Added:**
- Smart organization into 5 sections
- Confidence badges
- Advanced filtering (Make/Model/Year/Date)
- "Unknown or Generic Names" detection
- Active filter badges
- Collapsible sections
- View mode toggle with saved preference

**Kept:**
- Original table view
- Select all checkbox
- Bulk actions
- Fleet fault summary sidebar



