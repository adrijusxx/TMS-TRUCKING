'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Package, LayoutGrid, Navigation, Menu, ChevronDown } from 'lucide-react';
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
}

const navItems: NavItem[] = [
  { name: 'All Loads', href: '/dashboard/loads', icon: Package },
  { name: 'Driver Week Board', href: '/dashboard/loads/board', icon: LayoutGrid },
  { name: 'Operations Center', href: '/dashboard/operations', icon: Navigation },
];

export default function LoadHeaderNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: NavItem) => {
    if (item.href === '/dashboard/loads') {
      // Exact match for All Loads (not board)
      return pathname === '/dashboard/loads';
    }
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  const handleNavigation = (item: NavItem) => {
    router.push(item.href);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Mobile: Dropdown */}
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
              <Menu className="h-3 w-3 mr-1" />
              <span>Loads</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">Load Management</DropdownMenuLabel>
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const active = isActive(item);
              return (
                <DropdownMenuItem
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer text-xs',
                    active && 'bg-accent'
                  )}
                >
                  <ItemIcon className="h-3 w-3" />
                  <span>{item.name}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Horizontal buttons */}
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
                'h-6 text-xs px-2 gap-1',
                active && 'bg-accent'
              )}
            >
              <ItemIcon className="h-3 w-3" />
              <span>{item.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
