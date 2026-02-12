import {
  FileText,
  DollarSign,
  CreditCard,
  Building2,
  Receipt,
  Sliders,
  Fuel,
  Users,
} from 'lucide-react';

/**
 * Simplified Accounting Navigation
 * 6 core pages: Invoices, Salary, Expenses, IFTA, Factoring, Settings
 */
export const accountingNavigationSections = [
  {
    title: 'Core',
    icon: DollarSign,
    colorScheme: 'blue' as const,
    items: [
      {
        name: 'Invoices',
        href: '/dashboard/invoices',
        icon: FileText,
        description: 'Customer billing, aging, reconciliation, and invoice management.',
      },
      {
        name: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        description: 'Manage customers, contacts, and billing terms.',
      },
      {
        name: 'Settlements',
        href: '/dashboard/settlements',
        icon: CreditCard,
        description: 'Driver settlements, batches, reports, and balance tracking.',
      },
      {
        name: 'Expenses',
        href: '/dashboard/accounting/expenses',
        icon: Receipt,
        description: 'Track load expenses and operating costs.',
      },
    ],
  },
  {
    title: 'Compliance & Config',
    icon: Sliders,
    colorScheme: 'green' as const,
    items: [
      {
        name: 'IFTA',
        href: '/dashboard/accounting/ifta',
        icon: Fuel,
        description: 'Fuel tax reporting and compliance.',
      },
      {
        name: 'Factoring',
        href: '/dashboard/accounting/factoring',
        icon: Building2,
        description: 'Invoice factoring and factoring companies.',
      },
      {
        name: 'Settings',
        href: '/dashboard/accounting/settings',
        icon: Sliders,
        description: 'Deduction rules, tariffs, accessorial charges.',
      },
    ],
  },
];
