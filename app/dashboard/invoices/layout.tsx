'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DollarSign, FileText, Calculator, Tag, CreditCard, Sliders } from 'lucide-react';

const tabs = [
  { name: 'Batches', href: '/dashboard/batches', icon: FileText },
  { name: 'Invoices', href: '/dashboard/invoices', icon: DollarSign },
  { name: 'Aging report', href: '/dashboard/invoices/aging', icon: FileText },
  { name: 'Invoice reports', href: '/dashboard/invoices/reports', icon: FileText },
  { name: 'Reconciliation', href: '/dashboard/invoices/reconciliation', icon: DollarSign },
  { name: 'Watchdogs', href: '/dashboard/invoices/watchdogs', icon: FileText },
  { name: 'Automation', href: '/dashboard/automation', icon: Sliders },
  { name: 'Net Profit', href: '/dashboard/accounting/net-profit', icon: Calculator },
  { name: 'Expenses', href: '/dashboard/accounting/expenses', icon: Tag },
  { name: 'Tariffs', href: '/dashboard/accounting/tariffs', icon: FileText },
  { name: 'Payment Types', href: '/dashboard/accounting/order-payment-types', icon: CreditCard },
];

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex flex-wrap gap-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || 
              (tab.href !== '/dashboard/invoices' && pathname?.startsWith(tab.href));
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
