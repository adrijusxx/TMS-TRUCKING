'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Search,
    BookOpen,
    TruckIcon,
    FileText,
    DollarSign,
    Users,
    AlertCircle,
    CheckCircle,
    XCircle,
    HelpCircle,
    ChevronRight,
    ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultModule?: string;
    defaultTopic?: string;
}

export function HelpDialog({ open, onOpenChange, defaultModule, defaultTopic }: HelpDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState(defaultModule || 'loads');
    const [selectedTopic, setSelectedTopic] = useState(defaultTopic || null);

    const modules = [
        { id: 'loads', name: 'Loads', icon: TruckIcon, color: 'text-blue-500' },
        { id: 'invoices', name: 'Invoices', icon: FileText, color: 'text-green-500' },
        { id: 'settlements', name: 'Settlements', icon: DollarSign, color: 'text-purple-500' },
        { id: 'drivers', name: 'Drivers', icon: Users, color: 'text-orange-500' },
        { id: 'batches', name: 'Batches', icon: BookOpen, color: 'text-indigo-500' },
    ];

    const helpContent = {
        loads: {
            title: 'Load Management',
            topics: [
                {
                    id: 'create-load',
                    title: 'Creating a Load',
                    content: `
## Creating a Load

### Prerequisites
Before creating a load, ensure you have:
- ✅ At least one active **Customer**
- ✅ At least one active **Driver**
- ✅ At least one active **Truck**
- ✅ Valid **MC Number** assigned

### Step-by-Step

1. **Navigate to Loads**
   - Go to Dashboard → Loads → Create New Load

2. **Fill Required Fields**
   - **Customer** ⚠️ REQUIRED
   - **Load Number** ⚠️ REQUIRED (auto-generated or manual)
   - **Equipment Type** ⚠️ REQUIRED
   - **Pickup Location, City, State, Date** ⚠️ REQUIRED
   - **Delivery Location, City, State, Date** ⚠️ REQUIRED
   - **Revenue** ⚠️ REQUIRED (must be > 0)
   - **Weight** ⚠️ REQUIRED (in pounds)

3. **Add Mileage**
   - **Loaded Miles** (recommended) - used for driver pay
   - **Empty Miles** (optional) - deadhead miles
   - **Total Miles** = Loaded + Empty

4. **Assign Driver & Equipment** (optional at creation)
   - Driver → Select from active drivers
   - Truck → Auto-populated from driver
   - Trailer → Auto-populated from driver

5. **Save Load**
   - Status: PENDING or ASSIGNED

### Common Errors

❌ **"Customer is required"**
→ Select a customer from dropdown

❌ **"Load number already exists"**
→ Use a unique load number

❌ **"Pickup date cannot be in the past"**
→ Set pickup date to today or future

❌ **"Revenue must be greater than 0"**
→ Enter a positive revenue amount

❌ **"Driver CDL expired"**
→ Update driver's CDL expiry date in driver profile
          `,
                },
                {
                    id: 'ready-for-settlement',
                    title: 'Preparing Load for Settlement',
                    content: `
## Preparing Load for Settlement

For a load to be included in a settlement, it MUST meet ALL of these criteria:

### Required Conditions

1. **Status** must be one of:
   - DELIVERED
   - INVOICED
   - PAID
   - READY_TO_BILL
   - BILLING_HOLD (settlement can proceed even if billing is on hold)

2. **POD Uploaded**
   - Upload Proof of Delivery document
   - System sets \`podUploadedAt\` date automatically

3. **Ready for Settlement Flag**
   - Check the "Ready for Settlement" checkbox
   - Sets \`readyForSettlement = TRUE\`

4. **Delivered Date**
   - Must have \`deliveredAt\` date set
   - Date must be within settlement period

5. **MC Number Match**
   - Load's MC Number must match driver's MC Number
   - Or be in user's MC access list

### How to Mark Ready

1. Navigate to load details
2. Ensure status is DELIVERED
3. Upload POD document
4. Check "Ready for Settlement" box
5. Save changes

### Troubleshooting

❌ **Load not appearing in settlement**
→ Check all 5 conditions above

❌ **"No loads found for settlement period"**
→ Verify \`deliveredAt\` date is within period
→ Check \`readyForSettlement\` is TRUE
→ Confirm POD is uploaded
          `,
                },
                {
                    id: 'load-status',
                    title: 'Load Status Workflow',
                    content: `
## Load Status Workflow

### Status Progression

\`\`\`
PENDING → ASSIGNED → EN_ROUTE_PICKUP → AT_PICKUP → 
LOADED → EN_ROUTE_DELIVERY → AT_DELIVERY → DELIVERED → 
READY_TO_BILL → INVOICED → PAID
\`\`\`

### Status Descriptions

**PENDING** - Load created, not yet assigned to driver
**ASSIGNED** - Driver assigned, ready to dispatch
**EN_ROUTE_PICKUP** - Driver heading to pickup location
**AT_PICKUP** - Driver arrived at pickup
**LOADED** - Cargo loaded, ready for delivery
**EN_ROUTE_DELIVERY** - Driver heading to delivery
**AT_DELIVERY** - Driver arrived at delivery
**DELIVERED** - Cargo delivered, POD obtained
**BILLING_HOLD** - Blocks invoicing, allows settlement
**READY_TO_BILL** - Passed audit, ready for invoice
**INVOICED** - Invoice created and sent
**PAID** - Customer paid invoice

### Special Statuses

**BILLING_HOLD** - Use when:
- Customer disputes charges
- Waiting for additional documentation
- Rate confirmation issues
- Settlement can still proceed (AP independent of AR)

**CANCELLED** - Load cancelled, no further action
          `,
                },
            ],
        },
        invoices: {
            title: 'Invoice Management',
            topics: [
                {
                    id: 'create-invoice',
                    title: 'Creating an Invoice',
                    content: `
## Creating an Invoice

### Prerequisites

- ✅ Load status is **DELIVERED** or higher
- ✅ Load has **POD uploaded**
- ✅ Customer has **payment terms** set
- ✅ Customer is **not on credit hold**

### Step-by-Step

1. **Navigate to Invoices**
   - Dashboard → Invoices → Create Invoice

2. **Select Loads**
   - Only eligible loads will appear
   - Loads must be DELIVERED with POD
   - Loads cannot already be invoiced

3. **Fill Invoice Details**
   - **Invoice Number** ⚠️ REQUIRED (auto-generated)
   - **Customer** ⚠️ REQUIRED (from load)
   - **Invoice Date** ⚠️ REQUIRED (default: today)
   - **Due Date** ⚠️ REQUIRED (auto: invoice date + payment terms)

4. **Review Calculations**
   - **Subtotal** = Sum of load revenues
   - **Tax** = Subtotal × Tax Rate (if applicable)
   - **Total** = Subtotal + Tax
   - **Balance** = Total - Amount Paid

5. **Add Accessorial Charges** (optional)
   - Detention
   - Fuel Surcharge
   - Additional Stops
   - Layover
   - TONU

6. **Save Invoice**
   - Status: DRAFT, SENT, or PAID

### Common Errors

❌ **"No loads available"**
→ Check load status and POD upload

❌ **"Load already invoiced"**
→ Remove from other invoice first

❌ **"Customer on credit hold"**
→ Remove credit hold in customer settings

❌ **"Invoice number already exists"**
→ Use unique invoice number
          `,
                },
                {
                    id: 'invoice-batch',
                    title: 'Creating Invoice Batches',
                    content: `
## Creating Invoice Batches

### When to Use Batches

- Creating multiple invoices at once
- Grouping invoices by customer
- Bulk operations (posting, sending)
- Weekly/monthly billing cycles

### Step-by-Step

1. **Navigate to Batches**
   - Dashboard → Invoices → Create Batch

2. **Set Batch Parameters**
   - **Batch Number** (auto-generated)
   - **Date Range** for loads
   - **Customer** (optional - leave blank for all)

3. **Generate Batch**
   - System auto-creates invoices for eligible loads
   - Review invoice list

4. **Review and Edit**
   - Check each invoice
   - Add accessorial charges if needed
   - Verify totals

5. **Post Batch**
   - Marks batch as finalized
   - Invoices locked from editing
   - Status: POSTED

### Batch Prerequisites

⚠️ **All loads must:**
- Be DELIVERED status
- Have POD uploaded
- Not be already invoiced
- Belong to customers not on credit hold

### Batch Status

**UNPOSTED** - Batch created, invoices can be edited
**POSTED** - Batch finalized, invoices locked
          `,
                },
            ],
        },
        settlements: {
            title: 'Settlement Management',
            topics: [
                {
                    id: 'generate-settlement',
                    title: 'Generating a Settlement',
                    content: `
## Generating a Settlement

### Prerequisites

- ✅ Driver has **completed loads** in period
- ✅ Loads are **DELIVERED** status
- ✅ Loads have \`readyForSettlement = TRUE\`
- ✅ Loads have \`podUploadedAt\` date
- ✅ Driver has **pay rate** configured
- ✅ Driver has **MC Number** assigned

### Step-by-Step

1. **Navigate to Settlements**
   - Dashboard → Settlements → Generate Settlement

2. **Select Driver**
   - Choose from dropdown
   - Filter by MC Number if needed

3. **Select Period**
   - **Start Date** (typically Monday)
   - **End Date** (typically Sunday)
   - Weekly, bi-weekly, or monthly

4. **Review Preview**
   - **Gross Pay** = Total miles × Pay Rate
   - **Additions** (bonuses, reimbursements)
   - **Deductions** (insurance, ELD, lease, escrow)
   - **Advances** (fuel, cash)
   - **Net Pay** = Gross + Additions - Deductions - Advances

5. **Generate Settlement**
   - System creates settlement record
   - Links all deductions and advances
   - Handles negative balances if net pay < 0
   - Updates escrow balances

### Settlement Calculation

\`\`\`
Gross Pay = (Loaded Miles + Empty Miles) × Pay Rate

Net Pay = Gross Pay 
        + Additions (reimbursements, bonuses)
        - Deductions (insurance, ELD, lease)
        - Advances (fuel, cash)
        - Previous Negative Balance
\`\`\`

### Common Errors

❌ **"No loads found for settlement period"**
→ See troubleshooting section below

❌ **"Driver not found"**
→ Driver may be inactive or deleted

❌ **"Invalid pay rate"**
→ Set driver pay rate in driver profile

❌ **"MC Number mismatch"**
→ Ensure load and driver have same MC
          `,
                },
                {
                    id: 'negative-balance',
                    title: 'Understanding Negative Balances',
                    content: `
## Understanding Negative Balances

### What is a Negative Balance?

When a driver's **deductions exceed their gross pay**, the settlement results in a negative balance. This means the driver owes the company money.

### Example

\`\`\`
Gross Pay:     $180.05
Deductions:    $275.00
Net Pay:       -$94.95 (negative!)
\`\`\`

### What Happens?

1. **Settlement Created**
   - Net Pay stored as $0.00
   - Driver receives $0 payment

2. **Negative Balance Record Created**
   - Amount: $94.95
   - Linked to this settlement
   - Status: Not Applied

3. **Next Settlement**
   - Negative balance automatically deducted
   - Example:
     \`\`\`
     Gross Pay:              $500.00
     Deductions:             $275.00
     Previous Negative:      -$94.95
     Net Pay:                $130.05
     \`\`\`

4. **Balance Marked as Applied**
   - Previous negative balance record updated
   - Status: Applied
   - Applied date set

### Why Does This Happen?

Common causes:
- Driver had few loads (low miles)
- High recurring deductions (lease, insurance)
- Multiple advances taken
- Escrow deductions

### How to Prevent

- Monitor driver load assignments
- Adjust deduction amounts if needed
- Limit advances during low-mileage weeks
- Communicate with drivers about expectations

### Viewing Negative Balances

\`\`\`sql
SELECT amount, isApplied, notes
FROM "DriverNegativeBalance"
WHERE driverId = 'DRIVER_ID'
  AND isApplied = false;
\`\`\`
          `,
                },
                {
                    id: 'escrow-tracking',
                    title: 'Escrow & Goal-Based Deductions',
                    content: `
## Escrow & Goal-Based Deductions

### What is Escrow?

Escrow is a **goal-based deduction** where a fixed amount is deducted each settlement until a target amount is reached.

### Example

\`\`\`
Deduction: $100/week
Goal: $2,500
Weeks to complete: 25 weeks
\`\`\`

### How It Works

1. **Deduction Rule Created**
   - Type: ESCROW
   - Amount: $100
   - Goal Amount: $2,500
   - Current Amount: $0

2. **Each Settlement**
   - $100 deducted
   - Current Amount updated
   - Example progression:
     - Week 1: $100 / $2,500
     - Week 2: $200 / $2,500
     - Week 3: $300 / $2,500
     - ...
     - Week 25: $2,500 / $2,500 ✅ GOAL MET

3. **Goal Reached**
   - Deduction stops automatically
   - Rule remains active but amount = 0
   - Current Amount = Goal Amount

### Viewing Escrow Progress

In settlement details, you'll see:
\`\`\`
📊 Updated Escrow Balance: $100.00/$2,500.00 (4%)
\`\`\`

### Checking Escrow Status

\`\`\`sql
SELECT 
  name,
  amount,
  goalAmount,
  currentAmount,
  (currentAmount / goalAmount * 100) as progress_percent
FROM "DeductionRule"
WHERE deductionType = 'ESCROW'
  AND driverId = 'DRIVER_ID';
\`\`\`

### When Goal is Met

The deduction will automatically stop. No manual action needed!
          `,
                },
                {
                    id: 'settlement-troubleshooting',
                    title: 'Settlement Troubleshooting',
                    content: `
## Settlement Troubleshooting

### Error: "No loads found for settlement period"

This is the most common error. Check ALL of these:

#### 1. Load Status
\`\`\`sql
SELECT loadNumber, status
FROM "Load"
WHERE driverId = 'DRIVER_ID'
  AND deliveredAt BETWEEN 'START' AND 'END';
\`\`\`

✅ Status must be:
- DELIVERED
- INVOICED
- PAID
- READY_TO_BILL
- BILLING_HOLD

#### 2. Ready for Settlement Flag
\`\`\`sql
SELECT loadNumber, readyForSettlement
FROM "Load"
WHERE driverId = 'DRIVER_ID';
\`\`\`

✅ Must be TRUE

#### 3. POD Uploaded
\`\`\`sql
SELECT loadNumber, podUploadedAt
FROM "Load"
WHERE driverId = 'DRIVER_ID';
\`\`\`

✅ Must have a date (not NULL)

#### 4. Delivered Date
\`\`\`sql
SELECT loadNumber, deliveredAt
FROM "Load"
WHERE driverId = 'DRIVER_ID';
\`\`\`

✅ Must be within settlement period

#### 5. MC Number Match
\`\`\`sql
SELECT 
  l.loadNumber,
  l.mcNumberId as loadMC,
  d.mcNumberId as driverMC
FROM "Load" l
JOIN "Driver" d ON l.driverId = d.id
WHERE d.id = 'DRIVER_ID';
\`\`\`

✅ Load MC must match Driver MC

### Quick Fix Checklist

- [ ] Change load status to DELIVERED
- [ ] Upload POD document
- [ ] Check "Ready for Settlement" box
- [ ] Verify delivered date is set
- [ ] Confirm MC Numbers match
- [ ] Check date is within period

### Still Not Working?

Run this comprehensive query:
\`\`\`sql
SELECT 
  loadNumber,
  status,
  deliveredAt,
  readyForSettlement,
  podUploadedAt,
  mcNumberId,
  CASE 
    WHEN status NOT IN ('DELIVERED', 'INVOICED', 'PAID', 'READY_TO_BILL', 'BILLING_HOLD') 
      THEN '❌ Invalid status'
    WHEN readyForSettlement = false 
      THEN '❌ Not ready for settlement'
    WHEN podUploadedAt IS NULL 
      THEN '❌ No POD uploaded'
    WHEN deliveredAt IS NULL 
      THEN '❌ No delivered date'
    WHEN deliveredAt NOT BETWEEN 'START' AND 'END' 
      THEN '❌ Outside period'
    ELSE '✅ Eligible'
  END as eligibility
FROM "Load"
WHERE driverId = 'DRIVER_ID'
ORDER BY deliveredAt DESC;
\`\`\`
          `,
                },
            ],
        },
        drivers: {
            title: 'Driver Management',
            topics: [
                {
                    id: 'driver-setup',
                    title: 'Setting Up a Driver',
                    content: `
## Setting Up a Driver

### Required Information

**Personal:**
- First Name, Last Name
- Email (unique)
- Phone
- Social Security Number
- Date of Birth
- Hire Date

**License:**
- License Number
- License State
- License Expiry Date
- License Class (A, B, C)
- Endorsements (H, N, T, X, etc.)

**Medical:**
- Medical Card Expiry Date
- Drug Test Date

**Pay:**
- Pay Type (PER_MILE, PER_LOAD, PERCENTAGE, HOURLY, WEEKLY)
- Pay Rate (e.g., $0.65 for per-mile)

**Assignment:**
- MC Number
- Dispatcher
- Current Truck
- Current Trailer

### Pay Types Explained

**PER_MILE** ($0.65/mile)
- Most common
- Calculation: (Loaded Miles + Empty Miles) × Rate
- Example: 1,000 miles × $0.65 = $650

**PERCENTAGE** (25%)
- Percentage of load revenue
- Excludes fuel surcharge
- Example: $2,000 revenue × 25% = $500

**PER_LOAD** ($1,500/load)
- Fixed amount per load
- Regardless of miles
- Example: 3 loads × $1,500 = $4,500

**HOURLY** ($25/hour)
- Calculated from estimated hours
- Hours = Miles / 50 (average speed)
- Example: 500 miles / 50 = 10 hours × $25 = $250

**WEEKLY** ($1,200/week)
- Fixed weekly salary
- Regardless of loads or miles
- Example: $1,200 per settlement period

### Creating Deduction Rules

After creating driver, set up recurring deductions:

1. Navigate to driver profile
2. Go to "Deductions" tab
3. Click "Add Deduction Rule"
4. Fill details:
   - Name (e.g., "Weekly Insurance")
   - Type (INSURANCE, ESCROW, etc.)
   - Amount ($150)
   - Frequency (WEEKLY, MONTHLY)
   - Goal Amount (optional, for escrow)
5. Save

### Common Setup Errors

❌ **"Email already exists"**
→ Each driver needs unique email

❌ **"Invalid pay rate"**
→ Pay rate must be > 0

❌ **"MC Number required"**
→ Assign driver to MC Number

❌ **"CDL expired"**
→ Update expiry date to future date
          `,
                },
            ],
        },
        batches: {
            title: 'Batch Processing',
            topics: [
                {
                    id: 'salary-batch',
                    title: 'Creating Salary Batches',
                    content: `
## Creating Salary Batches

### What is a Salary Batch?

A salary batch groups multiple driver settlements together for payroll processing.

### When to Use

- Weekly payroll processing
- Bi-weekly pay periods
- Monthly settlements
- Bulk approval and posting

### Step-by-Step

1. **Navigate to Salary Batches**
   - Dashboard → Settlements → Create Salary Batch

2. **Set Batch Parameters**
   - **Batch Number** (auto-generated)
   - **Period Start Date** (e.g., Monday)
   - **Period End Date** (e.g., Sunday)

3. **Select Drivers**
   - Choose specific drivers
   - Or select "All Drivers"
   - Filter by MC Number

4. **Generate Batch**
   - System creates settlements for all selected drivers
   - Shows preview of each settlement

5. **Review Settlements**
   - Check each driver's settlement
   - Verify calculations
   - Edit if needed (while batch is OPEN)

6. **Approve Settlements**
   - Approve each settlement individually
   - Or bulk approve all

7. **Post Batch**
   - Marks batch as POSTED
   - Locks all settlements
   - Cannot edit after posting

### Batch Status

**OPEN** - Batch created, settlements can be edited
**POSTED** - Batch finalized, settlements locked
**ARCHIVED** - Historical batch, read-only

### Batch Prerequisites

⚠️ **Before creating batch:**
- All drivers must have completed loads
- Loads must be DELIVERED with POD
- Loads must be marked ready for settlement
- Drivers must have valid pay rates

### Common Errors

❌ **"No settlements generated"**
→ No drivers have eligible loads in period

❌ **"Batch already posted"**
→ Cannot edit posted batch, create new one

❌ **"Period overlap"**
→ Settlements already exist for this period
          `,
                },
            ],
        },
    };

    const currentModule = helpContent[selectedModule as keyof typeof helpContent];
    const filteredTopics = currentModule?.topics.filter(
        (topic) =>
            topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[80vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        TMS Help Center
                    </DialogTitle>
                    <div className="mt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search help articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r bg-muted/30 overflow-y-auto">
                        <div className="p-4 space-y-2">
                            {modules.map((module) => {
                                const Icon = module.icon;
                                return (
                                    <button
                                        key={module.id}
                                        onClick={() => {
                                            setSelectedModule(module.id);
                                            setSelectedTopic(null);
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                            selectedModule === module.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-muted'
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4', selectedModule === module.id ? '' : module.color)} />
                                        {module.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {!selectedTopic ? (
                            <ScrollArea className="flex-1 p-6">
                                <h2 className="text-2xl font-bold mb-4">{currentModule?.title}</h2>
                                <div className="grid gap-4">
                                    {filteredTopics?.map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => setSelectedTopic(topic.id)}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="h-5 w-5 text-primary" />
                                                <span className="font-medium">{topic.title}</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <ScrollArea className="flex-1 p-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTopic(null)}
                                    className="mb-4"
                                >
                                    ← Back to {currentModule?.title}
                                </Button>
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: currentModule?.topics
                                                .find((t) => t.id === selectedTopic)
                                                ?.content.replace(/\n/g, '<br />')
                                                .replace(/###/g, '<h3>')
                                                .replace(/##/g, '<h2>')
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/✅/g, '<span class="text-green-500">✅</span>')
                                                .replace(/❌/g, '<span class="text-red-500">❌</span>')
                                                .replace(/⚠️/g, '<span class="text-yellow-500">⚠️</span>')
                                                .replace(/```(.*?)```/gs, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto"><code>$1</code></pre>') || '',
                                        }}
                                    />
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
