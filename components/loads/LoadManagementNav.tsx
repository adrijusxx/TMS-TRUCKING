'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Package,
  TrendingUp,
  FileText,
  Search,
  Calendar,
  Navigation,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
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
  badge?: string;
  query?: string;
}

const navItems: NavItem[] = [
  { name: 'All Loads', href: '/dashboard/loads', icon: Package },
  { name: 'Live Loads', href: '/dashboard/loads', icon: TrendingUp, query: 'view=live' },
  { name: 'Loadboard', href: '/dashboard/loadboard', icon: Search, badge: 'NEW' },
  { name: 'Dispatch', href: '/dashboard/dispatch', icon: Calendar },
  { name: 'Live Map', href: '/dashboard/map', icon: Navigation },
];

export default function LoadManagementNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isOpen, toggle } = useSidebarToggle('loadManagementNavOpen', true);
  
  const currentView = searchParams.get('view') || 'all';

  const isActive = (item: NavItem) => {
    if (item.href !== '/dashboard/loads') {
      // For non-loads pages, check if pathname matches
      return pathname === item.href || pathname?.startsWith(item.href + '/');
    }
    
    // For loads page, check view parameter
    if (item.query) {
      const viewParam = item.query.split('=')[1];
      return pathname === '/dashboard/loads' && currentView === viewParam;
    }
    
    // Default "All Loads" is active when view is 'all' or no view param
    return pathname === '/dashboard/loads' && (currentView === 'all' || !searchParams.has('view'));
  };

  const handleNavigation = (item: NavItem) => {
    if (item.href === '/dashboard/loads' && item.query) {
      // Navigate to loads page with view query parameter
      router.push(`${item.href}?${item.query}`);
    } else {
      router.push(item.href);
    }
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
    <div className={cn(SIDEBAR_WIDTHS.expanded, 'border-r', NAV_BACKGROUNDS.sidebar, 'overflow-y-auto p-4', NAV_SPACING.sections)}>
      <div className={cn('flex items-center justify-between mb-1', NAV_BORDERS.header, 'pb-3 mb-3')}>
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
              <div className={cn('flex items-center', NAV_SPACING.iconText)}>
                {item.badge && (
                  <Badge variant="default" className="text-xs h-4 px-1">
                    {item.badge}
                  </Badge>
                )}
                {active && <ChevronRight className={cn(NAV_ICON_SIZES.chevron, 'flex-shrink-0')} />}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
