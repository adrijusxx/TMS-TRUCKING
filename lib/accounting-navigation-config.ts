import {
  FileText,
  DollarSign,
  CreditCard,
  Building2,
  Store,
  MapPin,
  BarChart3,
  Tag,
  Receipt,
  Calculator,
  Sliders,
} from 'lucide-react';

// Navigation sections configuration
export const accountingNavigationSections = [
  {
    title: 'Invoicing & Billing',
    icon: FileText,
    colorScheme: 'blue' as const,
    items: [
      {
        name: 'Invoices',
        href: '/dashboard/invoices',
        icon: FileText,
        description: 'Manage all customer invoices including creation, editing, and tracking. View invoice status (draft, sent, paid, overdue), track payment history, and generate invoice reports. Includes tabs for Aging, Reconciliation, Watchdogs, and Reports.',
      },
      {
        name: 'Batches',
        href: '/dashboard/accounting/batches',
        icon: FileText,
        description: 'Create and manage invoice batches for efficient bulk processing. Group multiple invoices together, process batch payments, and track batch status.',
      },
      {
        name: 'Rate Confirmations',
        href: '/dashboard/accounting/rate-confirmations',
        icon: Receipt,
        description: 'Manage rate confirmations for loads and shipments. Create rate confirmations, track rates, and ensure accurate billing.',
      },
      {
        name: 'Billing Exceptions Queue',
        href: '/dashboard/accounting/billing-exceptions',
        icon: FileText,
        description: 'Review loads with billing holds or ready for invoicing. Force release holds, upload missing PODs, and generate invoices.',
      },
      {
        name: 'Factoring',
        href: '/dashboard/accounting/factoring',
        icon: Building2,
        description: 'Manage invoice factoring transactions and track factored invoices. Submit invoices to factoring companies, track factoring status, and monitor factoring fees.',
      },
      {
        name: 'Factoring Companies',
        href: '/dashboard/accounting/factoring-companies',
        icon: Building2,
        description: 'Manage relationships with factoring companies and track factoring agreements. Store factoring company information, contact details, and terms.',
      },
    ],
  },
  {
    title: 'Payments & Expenses',
    icon: DollarSign,
    colorScheme: 'green' as const,
    items: [
      {
        name: 'Settlements',
        href: '/dashboard/settlements',
        icon: DollarSign,
        description: 'Process driver settlements and calculate driver pay based on loads, miles, and deductions. Create settlement statements, track settlement history, and manage driver payments.',
      },
      {
        name: 'Expenses',
        href: '/dashboard/accounting/expenses',
        icon: Tag,
        description: 'Track and categorize all business expenses including fuel, maintenance, insurance, permits, and operating costs. Record expense transactions, assign expense categories, and track expense trends.',
      },
      {
        name: 'Salary',
        href: '/dashboard/salary',
        icon: CreditCard,
        description: 'Manage employee salaries including dispatchers, office staff, and other salaried employees. Track salary payments, manage payroll, and maintain salary records.',
      },
      {
        name: 'Accessorial Charges',
        href: '/dashboard/accounting/accessorial-charges',
        icon: DollarSign,
        description: 'Manage accessorial charges and additional fees for loads including detention, layover, fuel surcharges, and special services. Configure charge types, set rates, and apply charges to invoices.',
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
        description: 'Manage International Fuel Tax Agreement (IFTA) reporting and compliance. Track fuel purchases by state, calculate IFTA taxes, and generate IFTA reports.',
      },
      {
        name: 'Net Profit',
        href: '/dashboard/accounting/net-profit',
        icon: Calculator,
        description: 'Calculate and analyze net profit for loads, trips, and overall operations. Track revenue, expenses, and profit margins.',
      },
      {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        description: 'Comprehensive financial analytics and reporting dashboard. View key financial metrics, revenue trends, expense analysis, and profitability reports.',
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
        description: 'Manage customer master data including contact information, billing addresses, payment terms, and credit limits. Track customer relationships, view customer history, and manage customer accounts.',
      },
      {
        name: 'Vendors',
        href: '/dashboard/vendors',
        icon: Store,
        description: 'Manage vendor master data including vendor information, contact details, payment terms, and vendor accounts. Track vendor relationships, view vendor history, and manage vendor payments.',
      },
      {
        name: 'Locations',
        href: '/dashboard/locations',
        icon: MapPin,
        description: 'Manage location master data including customer locations, vendor locations, and facility addresses. Store location details, coordinates, and location-specific information.',
      },
      {
        name: 'Tariffs',
        href: '/dashboard/accounting/tariffs',
        icon: DollarSign,
        description: 'Manage freight tariffs and rate schedules for different lanes, routes, and service types. Configure tariff rates, set up rate tables, and apply tariffs to loads and invoices.',
      },
      {
        name: 'Automation',
        href: '/dashboard/automation',
        icon: Sliders,
        description: 'Configure and manage accounting automation rules and workflows. Set up automated invoice generation, payment processing, and reporting.',
      },
      {
        name: 'Settings',
        href: '/dashboard/accounting/settings',
        icon: Sliders,
        description: 'Configure global accounting system settings including detention rates, TONU fees, factoring configuration, and settlement defaults.',
      },
    ],
  },
];

