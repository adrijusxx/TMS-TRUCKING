'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';
import {
  NAV_PADDING,
  NAV_SPACING,
  NAV_ICON_SIZES,
  NAV_TYPOGRAPHY,
  NAV_STATES,
  NAV_ROUNDED,
  NAV_BACKGROUNDS,
  NAV_CLASSES,
} from '@/lib/navigation-constants';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

type ColorScheme = 'red' | 'blue' | 'green' | 'purple' | 'yellow' | 'teal' | 'orange' | 'indigo';

interface SafetyNavSectionProps {
  title: string;
  items: NavItem[];
  icon: LucideIcon;
  colorScheme: ColorScheme;
  defaultOpen?: boolean;
}

// Standardized color classes - all sections use the same styling
// ColorScheme is kept for icon color only, but backgrounds are standardized
const colorClasses: Record<ColorScheme, {
  icon: string;
}> = {
  red: {
    icon: 'text-red-600 dark:text-red-400',
  },
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    icon: 'text-green-600 dark:text-green-400',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
  },
  yellow: {
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  teal: {
    icon: 'text-teal-600 dark:text-teal-400',
  },
  orange: {
    icon: 'text-orange-600 dark:text-orange-400',
  },
  indigo: {
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
};

export default function SafetyNavSection({
  title,
  items,
  icon: Icon,
  colorScheme,
  defaultOpen = false,
}: SafetyNavSectionProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colors = colorClasses[colorScheme];

  // Check if any item in this section is active
  const hasActiveItem = items.some(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  // Auto-open section if it contains active item
  useEffect(() => {
    if (hasActiveItem && !isOpen) {
      setIsOpen(true);
    }
  }, [hasActiveItem, isOpen]);

  return (
    <TooltipProvider delayDuration={300}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} suppressHydrationWarning>
        <CollapsibleTrigger
          suppressHydrationWarning
          className={cn(
            'w-full flex items-center justify-between',
            NAV_PADDING.trigger,
            NAV_ROUNDED.trigger,
            NAV_TYPOGRAPHY.item,
            NAV_STATES.transition,
            'font-semibold mb-1',
            NAV_BACKGROUNDS.triggerHover,
            hasActiveItem && NAV_BACKGROUNDS.triggerActive
          )}
        >
          <div className={cn('flex items-center', NAV_SPACING.iconText)}>
            <Icon className={cn(NAV_ICON_SIZES.item, colors.icon)} />
            <span className={NAV_TYPOGRAPHY.truncate}>{title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className={NAV_ICON_SIZES.chevron} />
          ) : (
            <ChevronRight className={NAV_ICON_SIZES.chevron} />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className={cn(NAV_SPACING.collapsibleItems, 'pl-7 mt-1')} suppressHydrationWarning>
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center',
                      NAV_SPACING.iconText,
                      isActive ? NAV_CLASSES.itemActive : NAV_CLASSES.itemHover
                    )}
                  >
                    <ItemIcon className={cn(NAV_ICON_SIZES.item, 'flex-shrink-0')} />
                    <span className={NAV_TYPOGRAPHY.truncate}>{item.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className={cn('font-medium mb-1', NAV_TYPOGRAPHY.truncate)}>{item.name}</p>
                  <p className={NAV_TYPOGRAPHY.description}>{item.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
}

