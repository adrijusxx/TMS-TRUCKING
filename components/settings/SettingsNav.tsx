'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import { usePermissions } from '@/hooks/usePermissions';
import {
  SIDEBAR_WIDTHS,
  NAV_SPACING,
  NAV_ICON_SIZES,
  NAV_TYPOGRAPHY,
  NAV_CLASSES,
  NAV_BORDERS,
  NAV_TOGGLE_BUTTONS,
  NAV_BACKGROUNDS,
} from '@/lib/navigation-constants';
import { getSettingsNavigationCategories, type NavItem, type NavCategory } from '@/lib/config/settings-navigation';

export default function SettingsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isOpen, toggle } = useSidebarToggle('settingsNavOpen', true);
  const { isAdmin } = usePermissions();

  // Determine base settings path based on role
  const baseSettingsPath = isAdmin ? '/dashboard/settings/admin' : '/dashboard/settings/employee';

  // Get navigation categories from config
  const navCategories = getSettingsNavigationCategories(baseSettingsPath);

  // Helper function to create unique key for items
  const getItemKey = (item: NavItem): string => {
    return `${item.name}:${item.href}:${item.query || ''}`;
  };

  // Filter categories and items based on admin status
  const visibleCategories = navCategories
    .filter(cat => !cat.adminOnly || isAdmin)
    .map(cat => ({
      ...cat,
      items: cat.items.filter(item => {
        // "General" is employee-only (admins use "System Configuration")
        if (item.name === 'General' && isAdmin) {
          return false;
        }
        // Other items follow normal adminOnly logic
        return !item.adminOnly || isAdmin;
      }),
    }))
    .filter(cat => cat.items.length > 0);

  // Deduplicate items using Set-based approach
  const seenItems = new Set<string>();
  const deduplicatedCategories = visibleCategories.map(cat => {
    const uniqueItems: NavItem[] = [];

    for (const item of cat.items) {
      const key = getItemKey(item);
      if (!seenItems.has(key)) {
        seenItems.add(key);
        uniqueItems.push(item);
      }
    }

    return {
      ...cat,
      items: uniqueItems,
    };
  }).filter(cat => cat.items.length > 0);

  // Ensure "Team & Users" is positioned correctly in Main Settings for admins
  if (isAdmin) {
    const mainSettingsCategory = deduplicatedCategories.find(cat => cat.name === 'Main Settings');
    const teamUsersItem = mainSettingsCategory?.items.find(item => item.name === 'Team & Users');

    if (mainSettingsCategory && teamUsersItem) {
      // Remove from current position
      mainSettingsCategory.items = mainSettingsCategory.items.filter(item => item.name !== 'Team & Users');

      // Insert after "Company & Organization"
      const companyOrgIndex = mainSettingsCategory.items.findIndex(item => item.name === 'Company & Organization');
      if (companyOrgIndex >= 0) {
        mainSettingsCategory.items.splice(companyOrgIndex + 1, 0, teamUsersItem);
      } else {
        mainSettingsCategory.items.unshift(teamUsersItem);
      }
    }
  }


  const isActive = (item: NavItem) => {
    // For settings pages with query params
    if (item.href === baseSettingsPath && item.query) {
      const currentTab = searchParams.get('tab');
      const expectedTab = item.query.split('=')[1];
      // Map old tab names to new ones
      const tabMap: Record<string, string> = {
        'company': 'company',
        'team': 'team',
        'system': 'system',
        'customizations': 'customizations',
        'integrations': 'integrations',
        'notifications': 'notifications',
        'security': 'security',
        'billing': 'billing',
        'appearance': 'appearance',
        'profile': 'profile',
        'general': isAdmin ? 'company' : 'profile',
      };
      const mappedTab = tabMap[currentTab || ''] || currentTab;
      return (pathname === '/dashboard/settings/admin' || pathname === '/dashboard/settings/employee') && mappedTab === expectedTab;
    }

    // For settings page without query (default)
    if (item.href === baseSettingsPath && !item.query) {
      const currentTab = searchParams.get('tab');
      const defaultTab = isAdmin ? 'company' : 'profile';
      return (pathname === '/dashboard/settings/admin' || pathname === '/dashboard/settings/employee') && (!currentTab || currentTab === defaultTab);
    }

    // For other pages
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  const handleNavigation = (item: NavItem) => {
    if (item.query) {
      router.push(`${item.href}?${item.query}`);
    } else {
      router.push(item.href);
    }
  };

  if (!isOpen) {
    return (
      <div className={cn(SIDEBAR_WIDTHS.collapsed, 'border-r', NAV_BACKGROUNDS.sidebar, 'p-2 flex flex-col items-center')}>
        <Button
          variant="ghost"
          size="icon"
          className={NAV_TOGGLE_BUTTONS.collapsed}
          onClick={toggle}
          title="Show sidebar"
        >
          <ChevronRight className={NAV_ICON_SIZES.chevron} />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(SIDEBAR_WIDTHS.expanded, 'border-r', NAV_BACKGROUNDS.sidebar, 'overflow-y-auto p-4', NAV_SPACING.sections)}>
      <div className={cn(NAV_BORDERS.header, 'pb-3 mb-3')}>
        <div className="flex items-center justify-between mb-1">
          <div className={cn('flex items-center', NAV_SPACING.iconText)}>
            <Settings className={cn(NAV_ICON_SIZES.section, 'text-primary')} />
            <h2 className={cn(NAV_TYPOGRAPHY.sectionHeader, NAV_TYPOGRAPHY.truncate)}>
              Settings
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={NAV_TOGGLE_BUTTONS.expanded}
            onClick={toggle}
            title="Hide sidebar"
          >
            <ChevronLeft className={NAV_ICON_SIZES.chevron} />
          </Button>
        </div>
      </div>
      <nav className={NAV_SPACING.items}>
        {deduplicatedCategories.map((category, categoryIndex) => (
          <div key={category.name} className={categoryIndex > 0 ? 'mt-6' : ''}>
            <h3 className={cn(NAV_TYPOGRAPHY.sectionHeader, 'text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2')}>
              {category.name}
            </h3>
            <div className="space-y-1">
              {category.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <button
                    key={`${category.name}-${item.name}-${itemIndex}`}
                    onClick={() => handleNavigation(item)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded-md',
                      active ? NAV_CLASSES.itemActive : NAV_CLASSES.itemHover
                    )}
                  >
                    <div className={cn('flex items-center', NAV_SPACING.iconText)}>
                      <Icon className={cn(NAV_ICON_SIZES.item, 'flex-shrink-0')} />
                      <span className={NAV_TYPOGRAPHY.truncate}>{item.name}</span>
                    </div>
                    {active && <ChevronRight className={cn(NAV_ICON_SIZES.chevron, 'flex-shrink-0')} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
