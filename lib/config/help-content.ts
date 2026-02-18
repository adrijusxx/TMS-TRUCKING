import {
  Rocket,
  TruckIcon,
  FileText,
  DollarSign,
  Users,
  BookOpen,
  Truck,
  Container,
  Building2,
  Upload,
} from 'lucide-react';

export interface HelpTopic {
  id: string;
  title: string;
  summary: string;
  content: string;
}

export interface HelpModule {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  topics: HelpTopic[];
}

export const helpModules: HelpModule[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: Rocket,
    color: 'text-emerald-500',
    description: 'First steps and system overview',
    topics: [
      {
        id: 'system-overview',
        title: 'System Overview',
        summary: 'How the TMS works end-to-end: the straight-line workflow from order to payment.',
        content: `## System Overview

### The Straight-Line Workflow

TMS follows a simple linear flow. Every load moves through these stages:

\`\`\`
Order → Dispatch → Delivery → Invoice → Settlement
\`\`\`

### Key Concepts

**Load** — The core entity. Every financial and operational record traces back to a load. A load represents a single shipment from pickup to delivery.

**Revenue** — What the customer pays you (line haul + fuel surcharge + accessorials).

**Driver Pay** — What you pay the driver, calculated automatically based on their pay profile.

**Net Profit** — Revenue minus driver pay minus expenses. Calculated automatically.

**MC Number** — Your motor carrier authority number. All data is scoped by MC number for multi-authority operations.

### Recommended Setup Order

For best results, import or create data in this order:

1. **Drivers** — Your driver roster with pay rates and CDL info
2. **Trucks** — Your fleet with VIN, year, make, model
3. **Trailers** — Trailer inventory with type and dimensions
4. **Customers** — Customer/broker list with billing info
5. **Loads** — Historical or active loads (requires drivers + customers)

### User Roles

| Role | Access |
|------|--------|
| Admin | Full access to all features |
| Dispatcher | Loads, dispatch, drivers, fleet |
| Accountant | Invoices, settlements, payments |
| Safety | Compliance, inspections, incidents |
| HR | Driver management, recruitment |
| Driver | Mobile app only |
| Customer | Tracking portal only |`,
      },
      {
        id: 'first-load',
        title: 'Creating Your First Load',
        summary: 'Step-by-step walkthrough of creating, dispatching, and completing your first load.',
        content: `## Creating Your First Load

### Before You Start

Make sure you have at least:
- One active **Customer** (the broker or shipper)
- One active **Driver** with a pay rate set
- One active **Truck** assigned to that driver

### Step 1: Create the Load

1. Go to **Load Management** in the sidebar
2. Click **+ New Load**
3. Fill in the required fields:
   - **Customer** — Select from dropdown
   - **Load Number** — Auto-generated or enter manually
   - **Equipment Type** — Dry Van, Reefer, Flatbed, etc.
   - **Pickup**: Location, City, State, Date
   - **Delivery**: Location, City, State, Date
   - **Revenue** — Customer rate (must be > 0)
   - **Weight** — In pounds
   - **Loaded Miles** — Used for driver pay calculation

### Step 2: Assign Driver & Equipment

- Select a **Driver** from the dropdown
- **Truck** and **Trailer** auto-populate from the driver's assignments
- Status changes to **ASSIGNED**

### Step 3: Dispatch

- The driver receives the load on their mobile app
- Status progression: EN_ROUTE_PICKUP → AT_PICKUP → LOADED → EN_ROUTE_DELIVERY → AT_DELIVERY

### Step 4: Mark Delivered

- Upload **Proof of Delivery (POD)** document
- Status changes to **DELIVERED**
- Check **"Ready for Settlement"** if you want to include in next payroll

### Step 5: Invoice & Settle

- Create an invoice for the customer (Accounting section)
- Generate a settlement for the driver (Settlements section)
- The load lifecycle is complete!`,
      },
    ],
  },
  {
    id: 'loads',
    name: 'Loads',
    icon: TruckIcon,
    color: 'text-blue-500',
    description: 'Creating, managing, and completing loads',
    topics: [
      {
        id: 'create-load',
        title: 'Creating a Load',
        summary: 'Required fields, optional fields, and common creation errors.',
        content: `## Creating a Load

### Prerequisites
Before creating a load, ensure you have:
- At least one active **Customer**
- At least one active **Driver**
- At least one active **Truck**
- Valid **MC Number** assigned

### Required Fields

| Field | Notes |
|-------|-------|
| Customer | Select from dropdown |
| Load Number | Auto-generated or manual (must be unique) |
| Equipment Type | Dry Van, Reefer, Flatbed, etc. |
| Pickup Location, City, State, Date | Full pickup address |
| Delivery Location, City, State, Date | Full delivery address |
| Revenue | Customer rate, must be > 0 |
| Weight | In pounds |

### Recommended Fields

- **Loaded Miles** — Used for per-mile driver pay calculation
- **Empty Miles** — Deadhead miles (optional)
- **Rate Confirmation #** — For reference
- **Commodity** — What's being hauled

### Assigning Driver & Equipment (optional at creation)

- Driver → Select from active drivers
- Truck → Auto-populated from driver's current truck
- Trailer → Auto-populated from driver's current trailer

### Common Errors

**"Customer is required"** → Select a customer from dropdown

**"Load number already exists"** → Use a unique load number

**"Revenue must be greater than 0"** → Enter a positive revenue amount

**"Driver CDL expired"** → Update driver's CDL expiry date in driver profile`,
      },
      {
        id: 'load-status',
        title: 'Load Status Workflow',
        summary: 'All load statuses explained and the progression from PENDING to PAID.',
        content: `## Load Status Workflow

### Status Progression

\`\`\`
PENDING → ASSIGNED → EN_ROUTE_PICKUP → AT_PICKUP →
LOADED → EN_ROUTE_DELIVERY → AT_DELIVERY → DELIVERED →
READY_TO_BILL → INVOICED → PAID
\`\`\`

### Status Descriptions

| Status | Meaning |
|--------|---------|
| PENDING | Load created, not yet assigned |
| ASSIGNED | Driver assigned, ready to dispatch |
| EN_ROUTE_PICKUP | Driver heading to pickup |
| AT_PICKUP | Driver arrived at pickup |
| LOADED | Cargo loaded, heading out |
| EN_ROUTE_DELIVERY | Driver heading to delivery |
| AT_DELIVERY | Driver arrived at delivery |
| DELIVERED | Cargo delivered, POD obtained |
| BILLING_HOLD | Blocks invoicing, allows settlement |
| READY_TO_BILL | Passed audit, ready for invoice |
| INVOICED | Invoice created and sent |
| PAID | Customer paid invoice |
| CANCELLED | Load cancelled, no further action |

### Special: BILLING_HOLD

Use when:
- Customer disputes charges
- Waiting for additional documentation
- Rate confirmation issues
- **Settlement can still proceed** (AP is independent of AR)`,
      },
      {
        id: 'ready-for-settlement',
        title: 'Preparing Load for Settlement',
        summary: 'The 5 conditions a load must meet to be included in a driver settlement.',
        content: `## Preparing Load for Settlement

For a load to be included in a settlement, it **must meet ALL** of these criteria:

### Required Conditions

1. **Status** must be one of: DELIVERED, INVOICED, PAID, READY_TO_BILL, or BILLING_HOLD

2. **POD Uploaded** — Upload the Proof of Delivery document

3. **Ready for Settlement Flag** — Check the "Ready for Settlement" checkbox

4. **Delivered Date** — Must have a delivered date set within the settlement period

5. **MC Number Match** — Load's MC Number must match the driver's MC Number

### How to Mark Ready

1. Navigate to load details
2. Ensure status is DELIVERED or higher
3. Upload POD document
4. Check "Ready for Settlement" box
5. Save changes

### Troubleshooting: Load Not Appearing in Settlement

Check each condition above. The most common issues:

- **readyForSettlement** is still FALSE — check the box
- **POD not uploaded** — upload the delivery receipt
- **Delivered date outside period** — verify the date range
- **MC Number mismatch** — ensure load and driver share the same MC`,
      },
    ],
  },
  {
    id: 'drivers',
    name: 'Drivers',
    icon: Users,
    color: 'text-orange-500',
    description: 'Driver profiles, pay types, and deductions',
    topics: [
      {
        id: 'driver-setup',
        title: 'Setting Up a Driver',
        summary: 'Required info, pay types, and how to configure recurring deductions.',
        content: `## Setting Up a Driver

### Required Information

**Personal:** First Name, Last Name, Email (unique), Phone, SSN, Date of Birth, Hire Date

**License:** License Number, State, Expiry Date, Class (A, B, C), Endorsements

**Medical:** Medical Card Expiry Date, Drug Test Date

**Pay:** Pay Type and Pay Rate

**Assignment:** MC Number, Dispatcher

### Pay Types Explained

| Type | Example | Calculation |
|------|---------|------------|
| PER_MILE | $0.65/mile | (Loaded + Empty Miles) x Rate |
| PERCENTAGE | 25% | Load Revenue x Rate |
| PER_LOAD | $1,500/load | Fixed per load |
| HOURLY | $25/hour | Estimated hours x Rate |
| WEEKLY | $1,200/week | Fixed weekly salary |

**PER_MILE** is the most common for OTR drivers. The system uses loaded + empty miles from each load.

**PERCENTAGE** excludes fuel surcharge by default (configurable in system settings).

### Creating Deduction Rules

After creating a driver, set up recurring deductions:

1. Navigate to driver profile → "Deductions" tab
2. Click "Add Deduction Rule"
3. Fill: Name, Type, Amount, Frequency
4. Optional: Goal Amount (for escrow-type deductions)

Common deductions: Insurance, ELD lease, truck lease, escrow, occupational accident.

### Common Errors

**"Email already exists"** → Each driver needs a unique email

**"Invalid pay rate"** → Pay rate must be greater than 0

**"MC Number required"** → Assign the driver to an MC Number`,
      },
    ],
  },
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
    id: 'invoices',
    name: 'Invoices',
    icon: FileText,
    color: 'text-green-500',
    description: 'Invoice creation, batches, and aging',
    topics: [
      {
        id: 'create-invoice',
        title: 'Creating an Invoice',
        summary: 'Prerequisites, step-by-step creation, and accessorial charges.',
        content: `## Creating an Invoice

### Prerequisites

- Load status is **DELIVERED** or higher
- Load has **POD uploaded**
- Customer has **payment terms** set
- Customer is **not on credit hold**

### Step-by-Step

1. Go to **Accounting** → **Invoices** → **Create Invoice**
2. Select eligible loads (must be DELIVERED with POD)
3. Fill invoice details:
   - **Invoice Number** — Auto-generated
   - **Customer** — From the load
   - **Invoice Date** — Default: today
   - **Due Date** — Auto-calculated from payment terms
4. Review calculations:
   - **Subtotal** = Sum of load revenues
   - **Tax** = Subtotal x Tax Rate (if applicable)
   - **Total** = Subtotal + Tax
5. Add accessorial charges if needed (Detention, Fuel Surcharge, TONU, etc.)
6. Save — Status: DRAFT, SENT, or PAID

### Common Errors

**"No loads available"** → Check load status and POD upload

**"Load already invoiced"** → Remove from another invoice first

**"Customer on credit hold"** → Remove credit hold in customer settings`,
      },
      {
        id: 'invoice-batch',
        title: 'Creating Invoice Batches',
        summary: 'Bulk invoicing: when to use batches, batch statuses, and posting.',
        content: `## Creating Invoice Batches

### When to Use Batches

- Creating multiple invoices at once
- Grouping invoices by customer
- Weekly/monthly billing cycles
- Bulk posting and sending

### Step-by-Step

1. Go to **Accounting** → **Invoices** → **Create Batch**
2. Set date range and optionally filter by customer
3. System auto-creates invoices for all eligible loads
4. Review each invoice, add accessorial charges if needed
5. **Post Batch** to finalize (locks all invoices from editing)

### Batch Statuses

| Status | Meaning |
|--------|---------|
| UNPOSTED | Invoices can still be edited |
| POSTED | Finalized, invoices locked |

### Prerequisites

All loads in the batch must be DELIVERED with POD, not already invoiced, and the customer must not be on credit hold.`,
      },
    ],
  },
  {
    id: 'settlements',
    name: 'Settlements',
    icon: DollarSign,
    color: 'text-purple-500',
    description: 'Driver pay, deductions, and payroll',
    topics: [
      {
        id: 'generate-settlement',
        title: 'Generating a Settlement',
        summary: 'Prerequisites, the settlement calculation formula, and common errors.',
        content: `## Generating a Settlement

### Prerequisites

- Driver has **completed loads** in the period
- Loads are **DELIVERED** with POD and **readyForSettlement = TRUE**
- Driver has a **pay rate** configured
- Driver has an **MC Number** assigned

### Step-by-Step

1. Go to **Accounting** → **Settlements** → **Generate**
2. Select a driver
3. Set the period (start and end dates)
4. Review the preview:
   - **Gross Pay** = Total miles x Pay Rate (varies by pay type)
   - **+ Additions** (bonuses, reimbursements, stop pay)
   - **- Deductions** (insurance, ELD, lease, escrow)
   - **- Advances** (fuel advances, cash advances)
   - **= Net Pay** (what the driver takes home)

### Settlement Formula

\`\`\`
Net Pay = Gross Pay + Additions - Deductions - Advances - Previous Negative Balance
\`\`\`

### Common Errors

**"No loads found for settlement period"** → Check all 5 load conditions (status, POD, ready flag, delivered date, MC match)

**"Driver not found"** → Driver may be inactive or deleted

**"Invalid pay rate"** → Set driver pay rate in driver profile`,
      },
      {
        id: 'negative-balance',
        title: 'Understanding Negative Balances',
        summary: 'What happens when deductions exceed gross pay and how it carries forward.',
        content: `## Understanding Negative Balances

### What is a Negative Balance?

When a driver's **deductions exceed their gross pay**, the settlement results in a negative balance. The driver owes the company money.

### Example

\`\`\`
Gross Pay:     $180.05
Deductions:    $275.00
Net Pay:       -$94.95 (negative!)
\`\`\`

### What Happens

1. **This Settlement** — Net Pay = $0.00, driver receives $0
2. **Negative Balance Created** — $94.95 recorded and linked to this settlement
3. **Next Settlement** — The $94.95 is automatically deducted:
   \`\`\`
   Gross Pay:          $500.00
   Deductions:         $275.00
   Previous Negative:  -$94.95
   Net Pay:            $130.05
   \`\`\`
4. **Balance Cleared** — Record marked as applied

### Common Causes

- Driver had few loads (low miles) that week
- High recurring deductions (lease, insurance)
- Multiple advances taken
- Escrow deductions stacking up`,
      },
      {
        id: 'escrow-tracking',
        title: 'Escrow & Goal-Based Deductions',
        summary: 'How escrow works: fixed weekly deductions toward a target amount.',
        content: `## Escrow & Goal-Based Deductions

### What is Escrow?

Escrow is a **goal-based deduction** where a fixed amount is deducted each settlement until a target is reached.

### Example

\`\`\`
Deduction: $100/week
Goal: $2,500
Weeks to complete: 25 weeks
\`\`\`

### How It Works

1. **Rule Created** — Type: ESCROW, Amount: $100, Goal: $2,500
2. **Each Settlement** — $100 deducted, progress tracked
3. **Goal Reached** — Deduction stops automatically

Progress is shown in settlement details:
\`\`\`
Escrow Balance: $100.00 / $2,500.00 (4%)
\`\`\`

When the goal is met, the deduction stops automatically. No manual action needed.`,
      },
    ],
  },
  {
    id: 'batches',
    name: 'Salary Batches',
    icon: BookOpen,
    color: 'text-indigo-500',
    description: 'Bulk payroll processing for drivers',
    topics: [
      {
        id: 'salary-batch',
        title: 'Creating Salary Batches',
        summary: 'Group multiple driver settlements for weekly/biweekly payroll processing.',
        content: `## Creating Salary Batches

### What is a Salary Batch?

A salary batch groups multiple driver settlements together for payroll processing.

### When to Use

- Weekly or bi-weekly payroll
- Monthly settlements
- Bulk approval and posting

### Step-by-Step

1. Go to **Accounting** → **Settlements** → **Create Salary Batch**
2. Set batch period (start and end dates)
3. Select drivers (specific or "All Drivers")
4. Generate — system creates settlements for all selected drivers
5. Review each settlement and verify calculations
6. Approve (individually or bulk)
7. Post batch — locks all settlements

### Batch Statuses

| Status | Meaning |
|--------|---------|
| OPEN | Settlements can be edited |
| POSTED | Finalized, locked |
| ARCHIVED | Historical, read-only |

### Prerequisites

All drivers must have eligible loads (DELIVERED, POD uploaded, ready for settlement) with valid pay rates configured.`,
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

/** Flat list of all topics across all modules, for search */
export function getAllTopics() {
  return helpModules.flatMap((m) =>
    m.topics.map((t) => ({ ...t, moduleId: m.id, moduleName: m.name }))
  );
}
