'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Package,
  TrendingUp,
  Search,
  Calendar,
  Navigation,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Menu, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export default function LoadHeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
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

  return (
    <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Mobile: Single dropdown menu */}
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-sm"
            >
              <Menu className="h-4 w-4" />
              <span>Loads Menu</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Load Management</DropdownMenuLabel>
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const active = isActive(item);
              return (
                <DropdownMenuItem
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    active && 'bg-accent'
                  )}
                >
                  <ItemIcon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <Badge variant="default" className="text-xs h-4 px-1 ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Horizontal tabs */}
      <div className="hidden lg:flex items-center gap-1">
        {navItems.map((item) => {
          const ItemIcon = item.icon;
          const active = isActive(item);
          return (
            <Button
              key={item.name}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNavigation(item)}
              className={cn(
                'flex items-center gap-2 text-sm whitespace-nowrap',
                active && 'bg-accent'
              )}
            >
              <ItemIcon className="h-4 w-4" />
              <span>{item.name}</span>
              {item.badge && (
                <Badge variant="default" className="text-xs h-4 px-1">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

