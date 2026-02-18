import { FileText, DollarSign, BookOpen } from 'lucide-react';
import type { HelpModule } from './types';

/** Invoices, Settlements, and Salary Batches modules */
export const financeModules: HelpModule[] = [
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
];
