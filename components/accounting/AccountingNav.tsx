'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FileText,
  DollarSign,
  CreditCard,
  Building2,
  Store,
  MapPin,
  BarChart3,
  ChevronRight,
  Sliders,
  Calculator,
  Tag,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Invoice', href: '/dashboard/invoices', icon: FileText },
  { name: 'Settlements', href: '/dashboard/settlements', icon: DollarSign },
  { name: 'Salary', href: '/dashboard/salary', icon: CreditCard },
  { name: 'Bill', href: '/dashboard/bills', icon: DollarSign },
  { name: 'Customers', href: '/dashboard/customers', icon: Building2 },
  { name: 'Vendors', href: '/dashboard/vendors', icon: Store },
  { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Automation', href: '/dashboard/automation', icon: Sliders },
  { name: 'Net Profit', href: '/dashboard/accounting/net-profit', icon: Calculator },
  { name: 'Expenses', href: '/dashboard/accounting/expenses', icon: Tag },
  { name: 'Tariffs', href: '/dashboard/accounting/tariffs', icon: DollarSign },
  { name: 'Payment Types', href: '/dashboard/accounting/order-payment-types', icon: CreditCard },
];

export default function AccountingNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: NavItem) => {
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  return (
    <div className="w-56 border-r bg-card p-2">
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Accounting
        </h2>
      </div>
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:bg-accent hover:text-foreground'
              )}
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {active && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
