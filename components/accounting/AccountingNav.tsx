'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileText,
  DollarSign,
  CreditCard,
  Building2,
  Store,
  MapPin,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Calculator,
  Tag,
  Receipt,
} from 'lucide-react';
import SafetyNavSection from '@/components/safety/SafetyNavSection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  SIDEBAR_WIDTHS,
  NAV_PADDING,
  NAV_SPACING,
  NAV_ICON_SIZES,
  NAV_TYPOGRAPHY,
  NAV_STATES,
  NAV_ROUNDED,
  NAV_CLASSES,
  NAV_BORDERS,
  NAV_TOGGLE_BUTTONS,
  NAV_BACKGROUNDS,
} from '@/lib/navigation-constants';

// Navigation sections configuration
const navigationSections = [
  {
    title: 'Billing & Invoicing',
    icon: FileText,
    colorScheme: 'blue' as const,
    items: [
      {
        name: 'Batches',
        href: '/dashboard/accounting/batches',
        icon: FileText,
        description: 'Create and manage invoice batches for efficient bulk processing. Group multiple invoices together, process batch payments, and track batch status. Generate batch reports, export batch data, and streamline your invoicing workflow. Use batches to organize invoices by customer, date, or payment method for easier management.',
      },
      {
        name: 'Invoices',
        href: '/dashboard/invoices',
        icon: FileText,
        description: 'Manage all customer invoices including creation, editing, and tracking. View invoice status (draft, sent, paid, overdue), track payment history, and generate invoice reports. Send invoices to customers, record payments, and monitor accounts receivable. Access invoice details, payment terms, and aging reports for effective cash flow management.',
      },
      {
        name: 'Invoice Aging',
        href: '/dashboard/invoices/aging',
        icon: FileText,
        description: 'View accounts receivable aging reports to track overdue invoices and manage collections. Analyze aging by customer, invoice age, and amount. Identify overdue accounts, prioritize collection efforts, and monitor cash flow. Generate aging reports for management review and collection planning.',
      },
      {
        name: 'Invoice Reconciliation',
        href: '/dashboard/invoices/reconciliation',
        icon: FileText,
        description: 'Reconcile invoices with payments and resolve discrepancies. Match payments to invoices, identify unmatched items, and resolve reconciliation issues. Track reconciliation status, generate reconciliation reports, and ensure accurate accounts receivable records. Use reconciliation to maintain accurate financial records.',
      },
      {
        name: 'Invoice Watchdogs',
        href: '/dashboard/invoices/watchdogs',
        icon: FileText,
        description: 'Monitor invoice watchdogs and alerts for payment issues, overdue invoices, and collection problems. Set up watchdogs for specific customers, invoice amounts, or payment terms. Receive alerts for payment delays, collection issues, and accounts requiring attention. Use watchdogs to proactively manage accounts receivable.',
      },
      {
        name: 'Invoice Reports',
        href: '/dashboard/invoices/reports',
        icon: FileText,
        description: 'Generate comprehensive invoice reports including sales reports, payment reports, and customer statements. Create custom reports, export invoice data, and analyze invoice trends. Track invoice performance, monitor payment patterns, and generate reports for management review and financial analysis.',
      },
      {
        name: 'Rate Confirmations',
        href: '/dashboard/accounting/rate-confirmations',
        icon: Receipt,
        description: 'Manage rate confirmations for loads and shipments. Create rate confirmations, track rates, and ensure accurate billing. Link rate confirmations to invoices, monitor rate changes, and maintain rate history. Use rate confirmations to verify billing accuracy and resolve rate disputes.',
      },
      {
        name: 'Billing Exceptions Queue',
        href: '/dashboard/accounting/billing-exceptions',
        icon: FileText,
        description: 'Review loads with billing holds or ready for invoicing. Force release holds, upload missing PODs, and generate invoices. Monitor loads requiring accounting attention and resolve billing exceptions quickly.',
      },
    ],
  },
  {
    title: 'Payments & Settlements',
    icon: DollarSign,
    colorScheme: 'green' as const,
    items: [
      {
        name: 'Settlements',
        href: '/dashboard/settlements',
        icon: DollarSign,
        description: 'Process driver settlements and calculate driver pay based on loads, miles, and deductions. Create settlement statements, track settlement history, and manage driver payments. Calculate fuel deductions, advances, and other deductions. Generate settlement reports and ensure accurate driver compensation.',
      },
      {
        name: 'Salary',
        href: '/dashboard/salary',
        icon: CreditCard,
        description: 'Manage employee salaries including dispatchers, office staff, and other salaried employees. Track salary payments, manage payroll, and maintain salary records. Process salary payments, track salary history, and generate payroll reports. Ensure accurate and timely salary payments for all employees.',
      },
      {
        name: 'Payment Types',
        href: '/dashboard/accounting/order-payment-types',
        icon: CreditCard,
        description: 'Configure and manage payment types for invoices and transactions. Define payment methods (check, wire transfer, ACH, credit card), set up payment processing, and track payment preferences by customer. Manage payment terms, discounts, and payment schedules. Use payment types to streamline payment processing and reporting.',
      },
    ],
  },
  {
    title: 'Expenses & Bills',
    icon: Tag,
    colorScheme: 'orange' as const,
    items: [
      {
        name: 'Expenses',
        href: '/dashboard/accounting/expenses',
        icon: Tag,
        description: 'Track and categorize all business expenses including fuel, maintenance, insurance, permits, and operating costs. Record expense transactions, assign expense categories, and track expense trends. Generate expense reports, analyze expense patterns, and use expense data for budgeting and cost management.',
      },
      {
        name: 'Accessorial Charges',
        href: '/dashboard/accounting/accessorial-charges',
        icon: DollarSign,
        description: 'Manage accessorial charges and additional fees for loads including detention, layover, fuel surcharges, and special services. Configure charge types, set rates, and apply charges to invoices. Track accessorial revenue, monitor charge trends, and ensure accurate billing for all additional services.',
      },
    ],
  },
  {
    title: 'Compliance & Reporting',
    icon: BarChart3,
    colorScheme: 'purple' as const,
    items: [
      {
        name: 'IFTA',
        href: '/dashboard/accounting/ifta',
        icon: Receipt,
        description: 'Manage International Fuel Tax Agreement (IFTA) reporting and compliance. Track fuel purchases by state, calculate IFTA taxes, and generate IFTA reports. Monitor fuel tax obligations, prepare quarterly IFTA filings, and ensure compliance with fuel tax requirements across all states where you operate.',
      },
      {
        name: 'Net Profit',
        href: '/dashboard/accounting/net-profit',
        icon: Calculator,
        description: 'Calculate and analyze net profit for loads, trips, and overall operations. Track revenue, expenses, and profit margins. Generate profit reports by load, customer, driver, or time period. Analyze profitability trends, identify profitable and unprofitable routes, and use profit data for pricing and operational decisions.',
      },
      {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        description: 'Comprehensive financial analytics and reporting dashboard. View key financial metrics, revenue trends, expense analysis, and profitability reports. Generate custom reports, analyze financial performance, and track key performance indicators (KPIs). Use analytics to make data-driven financial decisions and identify opportunities for improvement.',
      },
    ],
  },
  {
    title: 'Factoring & Financing',
    icon: Building2,
    colorScheme: 'yellow' as const,
    items: [
      {
        name: 'Factoring',
        href: '/dashboard/accounting/factoring',
        icon: Building2,
        description: 'Manage invoice factoring transactions and track factored invoices. Submit invoices to factoring companies, track factoring status, and monitor factoring fees. Record factoring payments, track factored amounts, and maintain factoring history. Use factoring to improve cash flow by receiving immediate payment on invoices.',
      },
      {
        name: 'Factoring Companies',
        href: '/dashboard/accounting/factoring-companies',
        icon: Building2,
        description: 'Manage relationships with factoring companies and track factoring agreements. Store factoring company information, contact details, and terms. Monitor factoring rates, fees, and contract terms. Track factoring company performance and manage multiple factoring relationships for optimal cash flow management.',
      },
    ],
  },
  {
    title: 'Master Data',
    icon: Store,
    colorScheme: 'teal' as const,
    items: [
      {
        name: 'Customers',
        href: '/dashboard/customers',
        icon: Building2,
        description: 'Manage customer master data including contact information, billing addresses, payment terms, and credit limits. Track customer relationships, view customer history, and manage customer accounts. Set up new customers, update customer information, and maintain customer records for accurate invoicing and relationship management.',
      },
      {
        name: 'Vendors',
        href: '/dashboard/vendors',
        icon: Store,
        description: 'Manage vendor master data including vendor information, contact details, payment terms, and vendor accounts. Track vendor relationships, view vendor history, and manage vendor payments. Set up new vendors, update vendor information, and maintain vendor records for accounts payable management.',
      },
      {
        name: 'Locations',
        href: '/dashboard/locations',
        icon: MapPin,
        description: 'Manage location master data including customer locations, vendor locations, and facility addresses. Store location details, coordinates, and location-specific information. Use locations for accurate billing, route planning, and geographic reporting. Maintain location database for efficient operations and accurate invoicing.',
      },
      {
        name: 'Tariffs',
        href: '/dashboard/accounting/tariffs',
        icon: DollarSign,
        description: 'Manage freight tariffs and rate schedules for different lanes, routes, and service types. Configure tariff rates, set up rate tables, and apply tariffs to loads and invoices. Track tariff changes, maintain tariff history, and ensure accurate rate application. Use tariffs for consistent pricing and rate management.',
      },
    ],
  },
  {
    title: 'Automation',
    icon: Sliders,
    colorScheme: 'indigo' as const,
    items: [
      {
        name: 'Automation',
        href: '/dashboard/automation',
        icon: Sliders,
        description: 'Configure and manage accounting automation rules and workflows. Set up automated invoice generation, payment processing, and reporting. Create automation rules for recurring transactions, automatic calculations, and workflow automation. Streamline accounting processes, reduce manual work, and improve efficiency through automation.',
      },
      {
        name: 'Settings',
        href: '/dashboard/accounting/settings',
        icon: Sliders,
        description: 'Configure global accounting system settings including detention rates, TONU fees, factoring configuration, and settlement defaults. Manage system-wide variables used by DetentionManager and DriverSettlement services.',
      },
    ],
  },
];

export default function AccountingNav() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accountingNavOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar preference to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('accountingNavOpen', String(newState));
  };

  if (!sidebarOpen) {
    return (
      <div className={cn(SIDEBAR_WIDTHS.collapsed, 'border-r', NAV_BACKGROUNDS.sidebar, 'p-2 flex flex-col items-center')}>
        <Button
          variant="ghost"
          size="icon"
          className={NAV_TOGGLE_BUTTONS.collapsed}
          onClick={toggleSidebar}
          title="Show sidebar"
        >
          <ChevronRight className={NAV_ICON_SIZES.chevron} />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(SIDEBAR_WIDTHS.expanded, 'border-r', NAV_BACKGROUNDS.sidebar, 'overflow-y-auto p-4', NAV_SPACING.sections)}>
      <div className={cn(NAV_BORDERS.header, 'pb-3 mb-3')}>
        <div className="flex items-center justify-between mb-1">
          <div className={cn('flex items-center', NAV_SPACING.iconText)}>
            <DollarSign className={cn(NAV_ICON_SIZES.section, 'text-primary')} />
            <h2 className={cn(NAV_TYPOGRAPHY.sectionHeader, NAV_TYPOGRAPHY.truncate)}>
              Accounting Department
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={NAV_TOGGLE_BUTTONS.expanded}
            onClick={toggleSidebar}
            title="Hide sidebar"
          >
            <ChevronLeft className={NAV_ICON_SIZES.chevron} />
          </Button>
        </div>
      </div>
      <nav className={NAV_SPACING.items}>
        <TooltipProvider delayDuration={300}>
          {/* Collapsible sections */}
          {navigationSections.map((section) => (
            <SafetyNavSection
              key={section.title}
              title={section.title}
              items={section.items}
              icon={section.icon}
              colorScheme={section.colorScheme}
            />
          ))}
        </TooltipProvider>
      </nav>
    </div>
  );
}
