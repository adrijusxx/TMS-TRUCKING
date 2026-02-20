'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface DepartmentNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface DepartmentNavProps {
  items: DepartmentNavItem[];
  /** Base path for exact-match on first item (e.g., '/dashboard/crm') */
  basePath?: string;
}

export function DepartmentNav({ items, basePath }: DepartmentNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      {items.map((item) => {
        const isActive = basePath && item.href === basePath
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap',
              isActive
                ? 'bg-primary/10 text-primary shadow-xs'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{item.name}</span>
            {item.badge && (
              <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
