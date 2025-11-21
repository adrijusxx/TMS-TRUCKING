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
      <div className="w-12 border-r bg-card p-2 flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggle}
          title="Show sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-56 border-r bg-card p-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Load Management
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggle}
          title="Hide sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item)}
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
              <div className="flex items-center gap-1">
                {item.badge && (
                  <Badge variant="default" className="text-xs h-4 px-1">
                    {item.badge}
                  </Badge>
                )}
                {active && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
