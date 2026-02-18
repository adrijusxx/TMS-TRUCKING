import { Rocket, TruckIcon, Users } from 'lucide-react';
import type { HelpModule } from './types';

/** Getting Started, Loads, and Drivers modules */
export const operationsModules: HelpModule[] = [
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
| HR | Driver management, recruiting |
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
];
