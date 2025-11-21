'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'HR Management', href: '/dashboard/hr', icon: Users },
  { name: 'Drivers', href: '/dashboard/drivers', icon: Users },
];

export default function HRManagementNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, toggle } = useSidebarToggle('hrManagementNavOpen', true);

  const isActive = (item: NavItem) => {
    return pathname === item.href || pathname?.startsWith(item.href + '/');
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
          HR Management
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
