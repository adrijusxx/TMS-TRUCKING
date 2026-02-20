'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface DepartmentNavSubItem {
  name: string;
  href: string;
}

export interface DepartmentNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: DepartmentNavSubItem[];
}

interface DepartmentNavProps {
  items: DepartmentNavItem[];
  basePath?: string;
}

export function DepartmentNav({ items, basePath }: DepartmentNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {items.map((item) => {
        if (item.children && item.children.length > 0) {
          return <DropdownNavItem key={item.href} item={item} pathname={pathname} />;
        }

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

function DropdownNavItem({
  item,
  pathname,
}: {
  item: DepartmentNavItem;
  pathname: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isActive =
    pathname === item.href ||
    pathname?.startsWith(item.href + '/') ||
    item.children?.some(
      (child) => pathname === child.href || pathname?.startsWith(child.href + '/')
    );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap',
          isActive
            ? 'bg-primary/10 text-primary shadow-xs'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <item.icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{item.name}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-popover border rounded-lg shadow-md py-1">
          {item.children!.map((child) => {
            const childActive = pathname === child.href || pathname?.startsWith(child.href + '/');
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2 text-sm transition-colors',
                  childActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
