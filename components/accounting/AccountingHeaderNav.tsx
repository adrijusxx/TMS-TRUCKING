'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { accountingNavigationSections } from '@/lib/accounting-navigation-config';
import { ChevronDown, Menu, Users } from 'lucide-react';

// Color scheme icon colors
const colorClasses: Record<string, string> = {
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  purple: 'text-purple-600 dark:text-purple-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  teal: 'text-teal-600 dark:text-teal-400',
  orange: 'text-orange-600 dark:text-orange-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
};

export default function AccountingHeaderNav() {
  const pathname = usePathname();

  // Check if any item in a section is active
  const isSectionActive = (section: typeof accountingNavigationSections[0]) => {
    return section.items.some(
      (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
    );
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
              <span>Accounting Menu</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Sections */}
            {accountingNavigationSections.map((section) => {
              const SectionIcon = section.icon;
              const sectionActive = isSectionActive(section);

              return (
                <div key={section.title}>
                  <DropdownMenuLabel className={cn(
                    'flex items-center gap-2',
                    sectionActive && 'text-primary'
                  )}>
                    <SectionIcon className={cn('h-4 w-4', colorClasses[section.colorScheme])} />
                    {section.title}
                  </DropdownMenuLabel>
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2 cursor-pointer pl-6',
                            isActive && 'bg-accent'
                          )}
                        >
                          <ItemIcon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  {section !== accountingNavigationSections[accountingNavigationSections.length - 1] && (
                    <DropdownMenuSeparator />
                  )}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Horizontal dropdowns */}
      <div className="hidden lg:flex items-center gap-1">
        {/* Sections as dropdown buttons */}
        {accountingNavigationSections.map((section) => {
          const SectionIcon = section.icon;
          const sectionActive = isSectionActive(section);

          return (
            <DropdownMenu key={section.title}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={sectionActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'flex items-center gap-1 text-sm whitespace-nowrap',
                    sectionActive && 'bg-accent'
                  )}
                >
                  <SectionIcon className={cn('h-4 w-4', colorClasses[section.colorScheme])} />
                  <span>{section.title}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>{section.title}</DropdownMenuLabel>
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer',
                          isActive && 'bg-accent'
                        )}
                      >
                        <ItemIcon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
    </div>
  );
}

