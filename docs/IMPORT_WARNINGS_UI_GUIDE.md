# Import Field Warnings UI - User Guide

## Overview

The import system now includes **real-time field validation** that shows warnings about missing fields before you import. This helps prevent import failures and ensures data completeness.

## What You'll See

When you upload a CSV/Excel file for import, the system automatically:

1. **Analyzes your file** against the database schema
2. **Identifies missing fields** (required, recommended, optional)
3. **Shows warnings** with clear explanations
4. **Suggests fixes** with CSV column name suggestions

## Warning Types

### 🔴 Critical Errors (Red Alert)

**These will cause import to FAIL:**

- Required fields without defaults
- Fields that database constraints require
- Missing fields that will cause NULL constraint errors

**Example:**
```
⚠️ Critical: Missing Required Fields (3)
Import Will Fail

- customerId (String, Required)
  What Will Break:
  • Database will reject records without this field
  • Import will fail with NULL constraint error
  
  Suggested CSV Column Names:
  [customerId] [customer_id] [Customer ID] [Customer Id]
```

### 🟡 Warnings (Yellow Alert)

**These have defaults but should be imported:**

- Fields with default values
- Import will work but may not have correct data
- Recommended to import for accuracy

**Example:**
```
⚠️ Recommended: Fields with Defaults (2)

- loadType (Default: FTL)
  Field has default value: FTL
  Import will work but may not have correct values
```

### 🔵 Info (Blue Alert)

**Optional fields - nice to have:**

- Fields that are optional in the database
- Import will work without them
- Consider adding for complete data

## How to Use

### Step 1: Upload Your File

1. Click "Import" button
2. Select your CSV/Excel file
3. System automatically analyzes the file

### Step 2: Review Warnings

After file upload, you'll see:

- **Red alerts** for critical missing fields
- **Yellow alerts** for recommended fields
- **Blue alerts** for optional fields

### Step 3: Fix Missing Fields

**Option A: Add Columns to Your File**
- Add the missing columns to your CSV/Excel
- Use suggested column names
- Re-upload the file

**Option B: Use Column Mapping**
1. Click "Map Columns" button
2. Map your existing columns to required fields
3. System will use mapped columns during import

**Option C: Proceed with Warnings** (Not Recommended)
- You can proceed if warnings are only "recommended"
- Critical errors will cause import to fail
- System will ask for confirmation

### Step 4: Import

1. Review all warnings
2. Fix critical issues
3. Click "Import" button
4. System validates again before importing

## Example Scenarios

### Scenario 1: Missing Customer ID

**What you see:**
```
🔴 Critical: Missing Required Fields (1)
Import Will Fail

- customerId (String, Required)
  What Will Break:
  • Database will reject records without this field
  • Import will fail with NULL constraint error
```

**How to fix:**
1. Add "Customer ID" or "customer_id" column to your CSV
2. Or map existing "Customer" column to "customerId"
3. Re-upload and warnings will disappear

### Scenario 2: Missing Equipment Type

**What you see:**
```
🔴 Critical: Missing Required Fields (1)

- equipmentType (enum:EquipmentType, Required)
  What Will Break:
  • Enum field requires valid value
  • Import will fail without valid enum value
  
  Suggested CSV Column Names:
  [equipmentType] [equipment_type] [Equipment Type]
```

**How to fix:**
1. Add "Equipment Type" column
2. Use valid enum values: DRY_VAN, REEFER, FLATBED, etc.
3. Or map existing column if it has different name

### Scenario 3: All Fields Present

**What you see:**
```
✅ All Required Fields Present
Your import file contains all required fields. 
The import should complete successfully.
```

## Features

### Smart Column Suggestions

The system suggests CSV column names based on:
- Field name variations (camelCase, snake_case, Title Case)
- Common naming patterns
- Existing columns in your file (highlighted)

### Click to Map

Click on suggested column names to automatically map them:
- Finds closest match in your CSV
- Updates column mapping
- Shows confirmation toast

### Expandable Details

Click "View Missing Fields" to see:
- Full list of missing fields
- What will break for each field
- Suggested column names
- Potential issues

### Pre-Import Validation

Before importing, the system:
- Checks all required fields again
- Shows confirmation dialog if critical fields missing
- Prevents accidental failed imports

## Best Practices

1. **Always review warnings** before importing
2. **Fix critical errors** - don't proceed with red alerts
3. **Use column mapping** if your CSV has different column names
4. **Add missing columns** to your file for best results
5. **Check suggested names** - they're based on common patterns

## Troubleshooting

### "Import Will Fail" but I have the data

**Problem:** Your CSV has the data but column name doesn't match

**Solution:** Use Column Mapping to map your column to the required field

### Too many warnings

**Problem:** Many optional fields showing as missing

**Solution:** These are informational only. Focus on red (critical) warnings.

### Can't find suggested column name

**Problem:** Suggested names don't match your CSV

**Solution:** 
1. Check your CSV column names
2. Use Column Mapping to manually map
3. Or rename your CSV columns to match suggestions

## Technical Details

- Validation runs automatically after file upload
- Checks against database schema in real-time
- No data sent to server until you click "Import"
- All validation happens client-side for speed

## Support

If you see warnings you don't understand:
1. Click "View Missing Fields" for details
2. Check "What Will Break" section
3. Review suggested column names
4. Use Column Mapping tool if needed

