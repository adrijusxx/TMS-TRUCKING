# Samsara Device Queue - Final Features

**Updated:** December 5, 2025  
**URL:** `http://localhost:3000/dashboard/fleet/devices`

## ✅ **All Features Implemented**

### 1. **Smart Sections** (5 Auto-Organized Groups)
- ✅ High Confidence Matches
- ℹ️ Complete Information
- ⚠️ Needs Review
- 🔘 Unknown or Generic Names
- ❌ Missing Information

### 2. **Global Select All**
- Checkbox at top of page
- Selects ALL devices across all sections
- Shows count: "5 devices selected"

### 3. **Per-Section Select All** ⭐ NEW
- Checkbox in each section header (left side)
- Select all devices in that section only
- Indeterminate state (partially selected)
- Example: Select all 10 devices in "High Confidence"

### 4. **Individual Checkboxes**
- On every device card (left side)
- Visual feedback (blue ring when selected)
- Works with global and section select

### 5. **Bulk Actions**
- **Approve Selected** - Create TMS records for selected
- **Reject Selected** - Reject all selected at once
- **Clear** - Deselect all

### 6. **Individual Actions**
- ✅ **Approve** - Create new TMS record
- 🔗 **Link** - Connect to existing record
- ❌ **Reject** - Mark as rejected

### 7. **Advanced Filters**
- 🔍 Search (name, VIN, plate)
- 🚛 Device Type (Truck/Trailer)
- 🏭 Make, Model
- 📅 Year Range
- 📆 Date Range

### 8. **Warning Banners**
- Info banner explaining sections
- ⚠️ **Approve vs Link warning** (helps avoid errors)

---

## 🎮 **How to Use Per-Section Select All**

### Select All in One Section:
```
1. Expand "High Confidence Matches" section
2. Click checkbox in section header (left side)
3. ✓ All 5 devices in that section selected
4. Other sections remain unselected
5. Click "Approve 5" to approve just those
```

### Select Multiple Sections:
```
1. Click checkbox in "High Confidence" header → 5 selected
2. Click checkbox in "Complete Info" header → 8 more selected
3. Now "13 devices selected" shows at top
4. Click "Approve 13" to approve all
```

### Indeterminate State:
```
1. Check 2 out of 5 devices in "High Confidence"
2. Section checkbox shows "indeterminate" (dash/line)
3. Click section checkbox → Selects remaining 3
4. Click again → Deselects all 5
```

---

## ⚠️ **Approve vs. Link (Important!)**

### When to Use **Approve**:
- Device is brand new (never in TMS before)
- Want to create a NEW truck/trailer record
- Device has unique VIN/truck number

### When to Use **Link**:
- Device already exists in TMS
- Want to connect Samsara device to existing record
- Getting "unique constraint" errors

### Your Error Explained:
```
Error: Unique constraint failed on (vin)
Error: Unique constraint failed on (truckNumber)

This means: These trucks ALREADY EXIST in your TMS!
Solution: Use "Link" button instead of "Approve"
```

---

## 🎯 **Common Workflows**

### 1. Bulk Approve New Devices
```
1. Go to "High Confidence Matches" section
2. Click section header checkbox (select all 5)
3. Verify they're NEW (not in TMS yet)
4. Click "Approve 5"
5. ✅ 5 new TMS records created
```

### 2. Bulk Reject Generic Names
```
1. Go to "Unknown or Generic Names" section
2. Click section header checkbox (select all)
3. Click "Reject 12"
4. ✅ All generic names rejected
```

### 3. Mixed Selection
```
1. Click "High Confidence" section checkbox → 5 selected
2. Manually check 3 devices from "Complete Info"
3. Manually check 2 devices from "Needs Review"
4. Total: 10 devices selected across 3 sections
5. Click "Approve 10" (if all are new)
```

### 4. Link Existing Devices
```
1. Try to approve devices with VINs
2. Get "unique constraint" error
3. Click "Link" button on each device instead
4. Select existing TMS truck/trailer
5. ✅ Connected to Samsara
```

---

## 📊 **Visual Guide**

### Section Header (with Select All):
```
┌──────────────────────────────────────────────┐
│ ☑️ ✅ High Confidence Matches (5)           │ ← Checkbox selects all 5
│    Devices with VIN or complete info         │
└──────────────────────────────────────────────┘
```

### Global Bulk Actions:
```
┌──────────────────────────────────────────────┐
│ ☑️ Select All   "13 devices selected"       │
│                                               │
│ [✅ Approve 13]  [❌ Reject 13]  [Clear]    │
└──────────────────────────────────────────────┘
```

### Device Card (with checkbox):
```
┌──────────────────────────────────────────────┐
│ ☑️ 🚛 378      [High Match]                 │
│    VIN: 3AKJHHDR4NSNB8227                    │
│    Make: Freightliner | Model: Cascadia      │
│                                               │
│    [✅ Approve] [🔗 Link] [❌ Reject]        │
└──────────────────────────────────────────────┘
```

---

## 🔑 **Checkbox Types**

| Checkbox | Location | What It Selects |
|----------|----------|-----------------|
| **Global** | Top of page | ALL devices |
| **Section** | Section header | All in that section |
| **Individual** | Device card | Just that device |

---

## 💡 **Pro Tips**

1. **Use section checkboxes** to approve by confidence level
2. **Global checkbox** for "approve everything"
3. **If approval fails** → Device exists, use Link instead
4. **Indeterminate state** shows partial selection
5. **Selection persists** when expanding/collapsing sections

---

## 🆕 **What's New in This Update**

- ✅ Per-section "Select All" checkboxes
- ✅ Warning banner about Approve vs Link
- ✅ Indeterminate state for partial selection
- ✅ Better error guidance

---

## 🐛 **Troubleshooting**

**Q: Getting "unique constraint" error?**  
A: Device already exists. Use **Link** instead of Approve.

**Q: Section checkbox not working?**  
A: Must expand section first, then click section header checkbox.

**Q: Selected devices disappeared?**  
A: Selection clears after bulk action completes (by design).

**Q: Want to select across multiple sections?**  
A: Use individual checkboxes OR click multiple section checkboxes.



