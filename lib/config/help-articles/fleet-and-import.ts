import { Truck, Container, Building2, Upload } from 'lucide-react';
import type { HelpModule } from './types';

/** Trucks, Trailers, Customers, and Data Import modules */
export const fleetAndImportModules: HelpModule[] = [
  {
    id: 'trucks',
    name: 'Trucks',
    icon: Truck,
    color: 'text-green-500',
    description: 'Fleet truck management and assignments',
    topics: [
      {
        id: 'truck-setup',
        title: 'Adding & Managing Trucks',
        summary: 'Required truck fields, status tracking, and driver assignments.',
        content: `## Adding & Managing Trucks

### Required Fields

| Field | Notes |
|-------|-------|
| Unit Number | Unique identifier (e.g., T-101) |
| VIN | 17-character Vehicle Identification Number |
| Year | Model year |
| Make | Manufacturer (Freightliner, Peterbilt, etc.) |
| Model | Model name (Cascadia, 579, etc.) |
| MC Number | Which authority this truck operates under |

### Recommended Fields

- **License Plate** and **Plate State** — For compliance
- **Current Odometer** — Tracked via Samsara integration or manual entry
- **Ownership Type** — Company, Leased, or Owner-Operator

### Truck Statuses

| Status | Meaning |
|--------|---------|
| AVAILABLE | Ready for dispatch |
| IN_USE | Currently on a load |
| MAINTENANCE | In shop for repair |
| OUT_OF_SERVICE | Not operational |

### Assigning to a Driver

Trucks are assigned through the **Driver Profile**:
1. Go to the driver's profile
2. Select the truck from "Current Truck" dropdown
3. The truck status automatically updates when loads are dispatched

### Import via CSV

Go to **Fleet** → **Trucks** → **Import** to bulk-upload your fleet. Required CSV columns: Unit Number, VIN, Year, Make, Model.`,
      },
    ],
  },
  {
    id: 'trailers',
    name: 'Trailers',
    icon: Container,
    color: 'text-amber-500',
    description: 'Trailer inventory and tracking',
    topics: [
      {
        id: 'trailer-setup',
        title: 'Adding & Managing Trailers',
        summary: 'Required fields, trailer types, and how trailers link to loads.',
        content: `## Adding & Managing Trailers

### Required Fields

| Field | Notes |
|-------|-------|
| Unit Number | Unique identifier (e.g., TR-201) |
| Type | Dry Van, Reefer, Flatbed, Step Deck, etc. |
| MC Number | Which authority this trailer operates under |

### Recommended Fields

- **Year, Make, Model** — For tracking
- **VIN** — For registration and compliance
- **License Plate & State** — Required for DOT
- **Length** — 53', 48', etc.

### Trailer Types

Common types in the system: DRY_VAN, REEFER, FLATBED, STEP_DECK, LOWBOY, TANKER, HOPPER, CONESTOGA, POWER_ONLY

### Assignment

Like trucks, trailers are assigned through the **Driver Profile**. When a load is created with a driver, the trailer auto-populates from the driver's current assignment.

### Import via CSV

Go to **Fleet** → **Trailers** → **Import** to bulk-upload. Required CSV columns: Unit Number, Type.`,
      },
    ],
  },
  {
    id: 'customers',
    name: 'Customers',
    icon: Building2,
    color: 'text-pink-500',
    description: 'Customer/broker profiles and billing',
    topics: [
      {
        id: 'customer-setup',
        title: 'Managing Customers & Brokers',
        summary: 'Setting up customers with payment terms, credit holds, and billing info.',
        content: `## Managing Customers & Brokers

### Required Fields

| Field | Notes |
|-------|-------|
| Name | Company or broker name |
| Email | Primary contact email |
| MC Number | Which MC this customer is associated with |

### Recommended Fields

- **Phone** — Primary contact number
- **Address, City, State, ZIP** — Billing address
- **Payment Terms** — NET 30, NET 15, etc. (used for invoice due dates)
- **Credit Limit** — Maximum outstanding balance allowed
- **Notes** — Internal notes about the customer

### Payment Terms

Payment terms determine the invoice due date:
- **NET 15** — Due 15 days after invoice date
- **NET 30** — Due 30 days after invoice date (most common)
- **NET 45** — Due 45 days after invoice date
- **DUE_ON_RECEIPT** — Due immediately

### Credit Hold

If a customer exceeds their credit limit or has overdue invoices:
1. Go to customer profile
2. Toggle **Credit Hold** on
3. While on hold, new invoices **cannot** be created for this customer
4. Existing loads are not affected

### Customer Types

- **DIRECT** — Direct shipper, you haul for them directly
- **BROKER** — A freight broker who books loads from their customers

### Import via CSV

Go to **Accounting** → **Customers** → **Import**. Required CSV columns: Name, Email.`,
      },
    ],
  },
  {
    id: 'importing',
    name: 'Data Import',
    icon: Upload,
    color: 'text-teal-500',
    description: 'Importing data from CSV and Excel files',
    topics: [
      {
        id: 'import-overview',
        title: 'How Importing Works',
        summary: 'Supported formats, the 3-step process, and AI-powered column matching.',
        content: `## How Importing Works

### Supported Formats

- **CSV** (.csv) — Comma-separated values
- **Excel** (.xlsx, .xls) — Microsoft Excel spreadsheets

### The 3-Step Process

**Step 1: Upload** — Select your file and choose the entity type (drivers, trucks, etc.)

**Step 2: Column Mapping** — The system uses AI to automatically match your CSV columns to system fields. You can adjust any mappings manually.

**Step 3: Preview & Import** — Review the parsed data, see any warnings or errors, then confirm the import.

### AI-Powered Features

- **Auto column mapping** — Matches "Driver Name" to "firstName + lastName", "Truck #" to "unitNumber", etc.
- **Data quality check** — Flags issues like missing required fields, invalid formats
- **Best-effort parsing** — Imports what it can, logs warnings for issues (doesn't fail the whole batch)

### Options

- **Update existing records** — If a matching record exists (by email, VIN, unit number), update it instead of creating a duplicate
- **Treat as historical** — For loads, marks them as historical data

### Tips for Best Results

1. **Clean your data first** — Remove empty rows, fix obvious typos
2. **Use headers** — First row should be column names
3. **Required fields** — Each entity has required columns (the system will tell you what's missing)
4. **Date formats** — MM/DD/YYYY or YYYY-MM-DD work best
5. **Import in order** — Drivers and Customers before Loads, so relationships can be linked`,
      },
      {
        id: 'import-order',
        title: 'Recommended Import Order',
        summary: 'Which entities to import first and why the order matters.',
        content: `## Recommended Import Order

### Why Order Matters

Loads reference drivers and customers. Trucks and trailers are assigned to drivers. Importing in the right order ensures all relationships link correctly.

### The Order

| Step | Entity | Why |
|------|--------|-----|
| 1 | **Drivers** | Loads need a driver to assign. Settlements need driver pay rates. |
| 2 | **Trucks** | Assigned to drivers. Shows in fleet management. |
| 3 | **Trailers** | Assigned to drivers. Used in load dispatch. |
| 4 | **Customers** | Loads need a customer. Invoices are per-customer. |
| 5 | **Loads** | References drivers and customers by name/email matching. |

### Accessing Import

Each entity section has an **Import** button:
- **Drivers**: HR → Drivers → Import
- **Trucks**: Fleet → Trucks → Import
- **Trailers**: Fleet → Trailers → Import
- **Customers**: Accounting → Customers → Import
- **Loads**: Load Management → Import

Or use the import links in the **Getting Started** guide on the dashboard.`,
      },
    ],
  },
];
