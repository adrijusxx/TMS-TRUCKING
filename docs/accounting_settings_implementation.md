# Accounting Settings Page Implementation

**Date:** 2025-01-27  
**Status:** ✅ **IMPLEMENTED**

---

## Overview

Created a new admin-only settings page at `/dashboard/accounting/settings` that allows configuration of global variables used by `DetentionManager` and `DriverSettlement` services.

---

## Files Created/Modified

### 1. **`prisma/schema.prisma`** ✅ UPDATED
- Added `SystemConfig` model with all required fields:
  - `defaultDetentionRate` (Float, default: 50)
  - `defaultFreeTimeMinutes` (Int, default: 120)
  - `standardTonuFee` (Float, default: 150)
  - `factoringActive` (Boolean, default: false)
  - `factoringCompanyName` (String?)
  - `factoringCompanyAddress` (String?)
  - `payDriverOnFuelSurcharge` (Boolean, default: false)
  - `companyFuelTaxRate` (Float?)

### 2. **`app/api/system-config/route.ts`** ✅ CREATED
- `GET /api/system-config` - Fetches system config (creates default if missing)
- `PATCH /api/system-config` - Updates system config (Admin only)

### 3. **`app/dashboard/accounting/settings/page.tsx`** ✅ CREATED
- Full-featured UI page with:
  - Global Variables section (Detention Rate, Free Time, TONU Fee)
  - Factoring Configuration section (Toggle, Name, Address)
  - Settlement Defaults section (Fuel Surcharge toggle, Fuel Tax Rate)
  - Save Changes button with loading state

### 4. **`lib/managers/DetentionManager.ts`** ✅ UPDATED
- Added `getSystemConfig()` method to fetch config from database
- Updated `checkDetentionOnDeparture()` to use system config values instead of hardcoded defaults
- Falls back to defaults if config doesn't exist

### 5. **`lib/accounting-navigation-config.ts`** ✅ UPDATED
- Added "Settings" link to Automation section

### 6. **`components/accounting/AccountingNav.tsx`** ✅ UPDATED
- Added "Settings" navigation item

---

## Database Migration

**⚠️ IMPORTANT:** You need to create and run the migration:

```bash
npx prisma migrate dev --name add_system_config
```

This will create the `SystemConfig` table in your database.

---

## Features

### Global Variables Section
- **Default Detention Rate**: Configurable hourly rate (default: $50/hour)
- **Default Free Time**: Configurable in minutes (default: 120 = 2 hours)
- **Standard TONU Fee**: Configurable fee (default: $150)

### Factoring Configuration
- **Factoring Active Toggle**: Enable/disable factoring
- **Factoring Company Name**: Text input
- **Factoring Company Address**: Textarea for full address

### Settlement Defaults
- **Pay Driver % on Fuel Surcharge**: Toggle (default: false)
- **Company Fuel Tax Rate**: Percentage input (e.g., 8.5%)

---

## Usage

### Accessing the Page
1. Navigate to **Accounting Department** → **Automation** → **Settings**
2. Or directly: `/dashboard/accounting/settings`
3. **Admin only** - Non-admin users are redirected

### Configuring Settings
1. Fill in the form fields
2. Click **Save Changes**
3. Settings are immediately applied to `DetentionManager` calculations

---

## Integration with DetentionManager

The `DetentionManager` now reads from `SystemConfig`:

```typescript
// Before (hardcoded):
const freeTimeHours = this.DEFAULT_FREE_TIME_HOURS; // 2 hours
const detentionRate = 50; // $50/hour

// After (from SystemConfig):
const systemConfig = await this.getSystemConfig(companyId);
const freeTimeHours = systemConfig.freeTimeHours; // From DB
const detentionRate = systemConfig.detentionRate; // From DB
```

**Fallback Logic:**
- If `SystemConfig` doesn't exist → uses defaults
- If `SystemConfig` exists but field is null → uses defaults
- Customer-specific values still take precedence (if set)

---

## API Endpoints

### GET `/api/system-config`
Returns system configuration for current company.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "config-123",
    "companyId": "company-123",
    "defaultDetentionRate": 50,
    "defaultFreeTimeMinutes": 120,
    "standardTonuFee": 150,
    "factoringActive": false,
    "factoringCompanyName": null,
    "factoringCompanyAddress": null,
    "payDriverOnFuelSurcharge": false,
    "companyFuelTaxRate": null
  }
}
```

### PATCH `/api/system-config`
Updates system configuration (Admin only).

**Request Body:**
```json
{
  "defaultDetentionRate": 55,
  "defaultFreeTimeMinutes": 90,
  "standardTonuFee": 175,
  "factoringActive": true,
  "factoringCompanyName": "ABC Factoring",
  "factoringCompanyAddress": "123 Main St\nCity, State ZIP",
  "payDriverOnFuelSurcharge": true,
  "companyFuelTaxRate": 8.5
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated config */ },
  "message": "System configuration updated successfully"
}
```

---

## Next Steps

1. **Run Migration**: Create and apply the database migration
2. **Update SettlementManager**: Similar to DetentionManager, update SettlementManager to read from SystemConfig for:
   - `payDriverOnFuelSurcharge`
   - `companyFuelTaxRate`
   - `standardTonuFee` (for TONU charges)

---

## Testing Checklist

- [x] SystemConfig model added to schema
- [x] API routes created (GET, PATCH)
- [x] UI page created with all form fields
- [x] DetentionManager updated to use SystemConfig
- [x] Navigation links added
- [x] Admin-only access enforced
- [ ] Database migration created and applied
- [ ] Test saving configuration
- [ ] Test DetentionManager reads from config
- [ ] Test fallback to defaults when config missing

---

**Implementation Status:** ✅ **COMPLETE** (Pending Migration)







