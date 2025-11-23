'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SafetyNavSection from '@/components/safety/SafetyNavSection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  SIDEBAR_WIDTHS,
  NAV_SPACING,
  NAV_ICON_SIZES,
  NAV_TYPOGRAPHY,
  NAV_TOGGLE_BUTTONS,
  NAV_BACKGROUNDS,
  NAV_BORDERS,
  NAV_CLASSES,
} from '@/lib/navigation-constants';
import { safetyNavigationSections, safetyStandaloneItems } from '@/lib/safety-navigation-config';

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('safetySidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar preference to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('safetySidebarOpen', String(newState));
  };

  if (!sidebarOpen) {
    return (
      <div className="flex">
        <div className={cn(SIDEBAR_WIDTHS.collapsed, 'border-r', NAV_BACKGROUNDS.sidebar, 'p-2 flex flex-col items-center')}>
          <Button
            variant="ghost"
            size="icon"
            className={NAV_TOGGLE_BUTTONS.collapsed}
            onClick={toggleSidebar}
            title="Show sidebar"
          >
            <ChevronRight className={NAV_ICON_SIZES.chevron} />
          </Button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 relative">
      <div className={cn(SIDEBAR_WIDTHS.expanded, 'border-r', NAV_BACKGROUNDS.sidebar, 'overflow-y-auto p-4', NAV_SPACING.sections)}>
        <div className={cn('flex items-center justify-between mb-1', NAV_BORDERS.header, 'pb-3 mb-3')}>
          <div className={cn('flex items-center', NAV_SPACING.iconText)}>
            <Shield className={cn(NAV_ICON_SIZES.section, 'text-primary')} />
            <h2 className={cn(NAV_TYPOGRAPHY.sectionHeader, NAV_TYPOGRAPHY.truncate)}>
              Safety Department
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={NAV_TOGGLE_BUTTONS.expanded}
            onClick={toggleSidebar}
            title="Hide sidebar"
          >
            <ChevronLeft className={NAV_ICON_SIZES.chevron} />
          </Button>
        </div>

        <nav className={NAV_SPACING.items}>
          <TooltipProvider delayDuration={300}>
            {/* Standalone items (always visible) */}
            {safetyStandaloneItems.map((item) => {
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
                    <p className="font-medium mb-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Collapsible sections */}
            {safetyNavigationSections.map((section) => (
              <SafetyNavSection
                key={section.title}
                title={section.title}
                items={section.items}
                icon={section.icon}
                colorScheme={section.colorScheme}
              />
            ))}
          </TooltipProvider>
        </nav>
      </div>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
