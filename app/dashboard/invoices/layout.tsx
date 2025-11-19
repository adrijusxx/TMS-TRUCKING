'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Batches', href: '/dashboard/batches' },
  { name: 'Invoices', href: '/dashboard/invoices' },
  { name: 'Aging report', href: '/dashboard/invoices/aging' },
  { name: 'Invoice reports', href: '/dashboard/invoices/reports' },
  { name: 'Reconciliation', href: '/dashboard/invoices/reconciliation' },
  { name: 'Watchdogs', href: '/dashboard/invoices/watchdogs' },
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
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || 
              (tab.href !== '/dashboard/invoices' && pathname?.startsWith(tab.href));
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
                )}
              >
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

