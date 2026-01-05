'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Package, Navigation, ChevronRight, ChevronLeft, LayoutGrid, UserCircle } from 'lucide-react';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import {
  SIDEBAR_WIDTHS,
  NAV_SPACING,
  NAV_ICON_SIZES,
  NAV_TYPOGRAPHY,
  NAV_CLASSES,
  NAV_BORDERS,
  NAV_TOGGLE_BUTTONS,
  NAV_BACKGROUNDS,
} from '@/lib/navigation-constants';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'All Loads', href: '/dashboard/loads', icon: Package },
  { name: 'My Dispatch', href: '/dashboard/dispatch-view', icon: UserCircle },
  { name: 'Driver Week Board', href: '/dashboard/loads/board', icon: LayoutGrid },
  { name: 'Operations Center', href: '/dashboard/operations', icon: Navigation },
];

export default function LoadManagementNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, toggle } = useSidebarToggle('loadManagementNavOpen', true);

  const isActive = (item: NavItem) => {
    if (item.href === '/dashboard/loads') {
      return pathname === '/dashboard/loads';
    }
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  const handleNavigation = (item: NavItem) => {
    router.push(item.href);
  };

  if (!isOpen) {
    return (
      <div className={cn(SIDEBAR_WIDTHS.collapsed, 'border-r', NAV_BACKGROUNDS.sidebar, 'p-2 flex flex-col items-center')}>
        <Button
          variant="ghost"
          size="icon"
          className={NAV_TOGGLE_BUTTONS.collapsed}
          onClick={toggle}
          title="Show sidebar"
        >
          <ChevronRight className={NAV_ICON_SIZES.chevron} />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(SIDEBAR_WIDTHS.expanded, 'border-r', NAV_BACKGROUNDS.sidebar, 'overflow-y-auto p-3', NAV_SPACING.sections)}>
      <div className={cn('flex items-center justify-between mb-1', NAV_BORDERS.header, 'pb-2 mb-2')}>
        <div className={cn('flex items-center', NAV_SPACING.iconText)}>
          <Package className={cn(NAV_ICON_SIZES.section, 'text-primary')} />
          <h2 className={cn(NAV_TYPOGRAPHY.sectionHeader, NAV_TYPOGRAPHY.truncate)}>
            Load Management
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={NAV_TOGGLE_BUTTONS.expanded}
          onClick={toggle}
          title="Hide sidebar"
        >
          <ChevronLeft className={NAV_ICON_SIZES.chevron} />
        </Button>
      </div>
      <nav className={NAV_SPACING.items}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item)}
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
          );
        })}
      </nav>
    </div>
  );
}
