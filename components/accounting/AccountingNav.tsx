'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileText,
  DollarSign,
  CreditCard,
  Building2,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Receipt,
  Fuel,
  Users,
} from 'lucide-react';
import {
  SIDEBAR_WIDTHS,
  NAV_SPACING,
  NAV_ICON_SIZES,
  NAV_TYPOGRAPHY,
  NAV_TOGGLE_BUTTONS,
  NAV_BACKGROUNDS,
  NAV_BORDERS,
} from '@/lib/navigation-constants';

// Simplified navigation - 6 core pages
const navigationItems = [
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: FileText,
    description: 'Customer billing and invoices',
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    description: 'Manage customers and contacts',
  },
  {
    name: 'Settlements',
    href: '/dashboard/settlements',
    icon: CreditCard,
    description: 'Driver settlements and pay',
  },
  {
    name: 'Expenses',
    href: '/dashboard/accounting/expenses',
    icon: Receipt,
    description: 'Load expenses tracking',
  },
  {
    name: 'IFTA',
    href: '/dashboard/accounting/ifta',
    icon: Fuel,
    description: 'Fuel tax reporting',
  },
  {
    name: 'Factoring',
    href: '/dashboard/accounting/factoring',
    icon: Building2,
    description: 'Invoice factoring',
  },
  {
    name: 'Settings',
    href: '/dashboard/accounting/settings',
    icon: Sliders,
    description: 'Accounting configuration',
  },
];

export default function AccountingNav() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('accountingNavOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

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
              Accounting
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

      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
