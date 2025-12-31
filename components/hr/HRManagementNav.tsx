'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight, ChevronLeft, UserCheck } from 'lucide-react';
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

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    name: 'HR Dashboard',
    href: '/dashboard/hr',
    icon: Users,
    description: 'Comprehensive HR management dashboard. View performance metrics, settlements, retention analytics, and bonus calculations.',
  },
  {
    name: 'Driver Management',
    href: '/dashboard/drivers',
    icon: UserCheck,
    description: 'Unified driver management including employment status, payroll, compliance, and operational details.',
  },
];

export default function HRManagementNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hrManagementNavOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar preference to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('hrManagementNavOpen', String(newState));
  };

  const isActive = (item: NavItem) => {
    return pathname === item.href || pathname?.startsWith(item.href + '/');
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
      <div className={cn('flex items-center justify-between mb-1', NAV_BORDERS.header, 'pb-3 mb-3')}>
        <div className={cn('flex items-center', NAV_SPACING.iconText)}>
          <Users className={cn(NAV_ICON_SIZES.section, 'text-primary')} />
          <h2 className={cn(NAV_TYPOGRAPHY.sectionHeader, NAV_TYPOGRAPHY.truncate)}>
            HR Management
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
      <nav className={NAV_SPACING.items}>
        <TooltipProvider delayDuration={300}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push(item.href)}
                    className={cn(
                      'w-full flex items-center justify-between',
                      active ? NAV_CLASSES.itemActive : NAV_CLASSES.itemHover
                    )}
                  >
                    <div className={cn('flex items-center', NAV_SPACING.iconText)}>
                      <Icon className={cn(NAV_ICON_SIZES.item, 'flex-shrink-0')} />
                      <span className={NAV_TYPOGRAPHY.truncate}>{item.name}</span>
                    </div>
                    {active && <ChevronRight className={cn(NAV_ICON_SIZES.chevron, 'flex-shrink-0')} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className={cn('font-medium mb-1', NAV_TYPOGRAPHY.truncate)}>{item.name}</p>
                  <p className={NAV_TYPOGRAPHY.description}>{item.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>
    </div>
  );
}
