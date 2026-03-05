'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText, Clock, Users, BarChart3, Wallet, UserCheck, CreditCard,
  CalendarClock, ArrowRight, Info, Lightbulb,
} from 'lucide-react';

const SECTIONS = [
  {
    icon: Clock,
    title: 'Pending',
    color: 'text-amber-500',
    description: 'Preview and generate settlements for drivers with delivered loads.',
    details: [
      'Shows drivers who have delivered loads that haven\'t been settled yet.',
      'Each row shows a preview: gross pay, deductions, advances, and net pay — no records are saved until you generate.',
      'Click a row to see the full breakdown (loads, deduction rules, advance deductions) in a side panel.',
      'Select one or more drivers, then click "Generate Settlements" to create settlement records.',
      'Negative balances from the Balances tab are automatically applied as deductions here.',
    ],
    tips: [
      'You can generate settlements for individual drivers or select all at once.',
      'Review the draft breakdown before generating to catch any issues.',
    ],
  },
  {
    icon: FileText,
    title: 'Batches',
    color: 'text-blue-500',
    description: 'Group settlements into salary batches for organized payroll processing.',
    details: [
      'Create a new batch by selecting a date range — settlements are auto-generated for all active drivers with delivered loads in that period.',
      'Each batch tracks: status (Open → Posted → Archived), check date, pay company, and total amount.',
      'Click a batch row to drill into the Batch Detail page where you can review every settlement.',
      'From Batch Detail you can: post the batch, send statements to drivers, export PDF/CSV, and edit check date or notes.',
      'Use the < > arrows inside a settlement to navigate between settlements in the same batch.',
    ],
    tips: [
      'Post a batch only after reviewing all settlements. Posting marks it as finalized.',
      'Use "Send" to email settlement statements to all drivers in the batch at once.',
    ],
  },
  {
    icon: Users,
    title: 'All Settlements',
    color: 'text-violet-500',
    description: 'Browse, filter, and manage all settlement records across batches.',
    details: [
      'Shows a flat list of every settlement in the system with date range and status filters.',
      'Columns include: payee, batch #, settlement date, period, status, trips, gross, advances, deductions, net pay, and more.',
      'Click any settlement row to open the full Settlement Detail sheet for editing.',
      'Running totals at the bottom show cross-page aggregates for gross pay, advances, deductions, and net pay.',
      'Export to CSV for external reporting or accounting software.',
    ],
    tips: [
      'Use the status filter to quickly find pending or disputed settlements.',
      'The totals row reflects ALL matching settlements, not just the current page.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Reports',
    color: 'text-green-500',
    description: 'View aggregated salary statistics and driver pay summaries.',
    details: [
      'Summary cards show total gross pay, net pay, settlement count, and active driver count for the selected period.',
      'Breakdown by driver type (Company Driver, Owner Operator, Lease) with count, total pay, and average per driver.',
      'Deductions & Advances summary shows the total amounts deducted and advanced across all settlements.',
      'Choose from preset periods: Current Month, Last Month, Last 3 Months, or Last 12 Months.',
    ],
    tips: [
      'Use this tab for quick payroll summaries before running actual payroll.',
      'Compare driver type averages to spot outliers or pay discrepancies.',
    ],
  },
  {
    icon: Wallet,
    title: 'Balances',
    color: 'text-orange-500',
    description: 'Track driver advance requests and negative balances.',
    details: [
      '"Advance Requests" sub-tab: lists all driver advance requests with amount, status, and dates.',
      '"Driver Balances" sub-tab: computed per-driver view showing pending advances, approved advances, negative balance, and total owed.',
      'Summary cards show totals for pending advances, approved advances, total outstanding, and active request count.',
      'Negative balances are automatically deducted when the next settlement is generated in the Pending tab.',
    ],
    tips: [
      'Review and approve advance requests here before generating settlements.',
      'Drivers with high negative balances will see larger deductions on their next settlement.',
    ],
  },
  {
    icon: UserCheck,
    title: 'Dispatcher Salary',
    color: 'text-teal-500',
    description: 'Manage dispatcher commissions separate from driver settlements.',
    details: [
      'Lists dispatcher commission records per load, showing: dispatcher name, load #, revenue, commission type (% or flat), amount, and status.',
      'Select pending commissions and click "Approve" to mark them as approved for payment.',
      'Summary cards show total commissions, pending approval amount, and dispatcher count.',
      'Grouped view by dispatcher shows each dispatcher\'s total earned, load count, and pending amount.',
    ],
    tips: [
      'Dispatcher commissions are completely separate from driver settlements — they don\'t affect each other.',
      'Use the date filter to review commissions for specific pay periods.',
    ],
  },
  {
    icon: CreditCard,
    title: 'One Time Charges',
    color: 'text-red-500',
    description: 'Create one-time additions or deductions applied to the next settlement.',
    details: [
      'Add a one-time charge (addition or deduction) for a specific driver or company-wide.',
      'Addition types: Bonus, Overtime, Incentive, Reimbursement.',
      'Deduction types: Fuel Advance, Cash Advance, Insurance, Truck Payment, Escrow, Tolls, Permits, and more.',
      'The charge is applied once when the next settlement is generated, then consumed.',
      'Each charge shows: driver, name, type, category, amount, and active status.',
    ],
    tips: [
      'Use this for bonuses, one-off reimbursements, or special deductions that shouldn\'t recur.',
      'Company-wide charges (no driver selected) apply to ALL drivers on their next settlement.',
    ],
  },
  {
    icon: CalendarClock,
    title: 'Scheduled Payments',
    color: 'text-indigo-500',
    description: 'Set up recurring deductions or additions applied on every settlement.',
    details: [
      'Create recurring rules with frequencies: Weekly, Biweekly, Monthly, or Per Settlement.',
      'Calculation types: Fixed dollar amount, Percentage of gross, or Per Mile rate.',
      'Set an optional goal amount (e.g., $5,000 escrow target) to track progress — the rule auto-stops when the goal is reached.',
      'Scope: apply to a specific driver, a driver type (Company/Owner Operator/Lease), or company-wide.',
      'Toggle rules Active/Paused at any time without deleting them.',
    ],
    tips: [
      'Use "Per Settlement" frequency for deductions that should apply every pay period regardless of schedule.',
      'Set a goal amount for escrow or truck payment plans to automatically stop deducting once the target is met.',
    ],
  },
];

export default function SalaryHelpTab() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Salary Module Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The salary module handles the full payroll lifecycle for drivers: from delivered loads to finalized pay statements.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
            <span className="font-medium text-foreground">Typical workflow:</span>
            <span>Scheduled Payments / One Time Charges</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span>Pending (preview)</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span>Generate</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span>Batches or All Settlements</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span>Post & Send</span>
          </div>
          <p className="text-muted-foreground">
            Balances tracks advances and negative balances. Reports provides aggregated statistics. Dispatcher Salary is a separate commission system.
          </p>
        </CardContent>
      </Card>

      {/* Feature Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className={`h-5 w-5 ${section.color}`} />
                  {section.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm">
                  {section.details.map((detail, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
                {section.tips.length > 0 && (
                  <div className="border-t pt-2 space-y-1.5">
                    {section.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex gap-1.5 items-start">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        {tip}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
