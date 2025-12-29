'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users, UserCheck } from 'lucide-react';
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
}

const navItems: NavItem[] = [
  {
    name: 'HR Management',
    href: '/dashboard/hr',
    icon: Users,
  },
  {
    name: 'Drivers',
    href: '/dashboard/drivers',
    icon: UserCheck,
  },
];

export default function HRHeaderNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: NavItem) => {
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  const handleNavigation = (item: NavItem) => {
    router.push(item.href);
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
              <span>HR Menu</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>HR Management</DropdownMenuLabel>
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
            </Button>
          );
        })}
      </div>
    </div>
  );
}

