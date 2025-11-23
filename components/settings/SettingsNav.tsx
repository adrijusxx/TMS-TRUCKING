'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Users,
  Shield,
  CreditCard,
  Plug,
  RefreshCw,
  FileText,
  Hash,
  ShoppingBag,
  DollarSign,
  Calculator,
  Palette,
  Tag,
  FolderTree,
  FileCheck,
  ChartBar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Building2,
  Bell,
} from 'lucide-react';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import { usePermissions } from '@/hooks/usePermissions';
import {
  SIDEBAR_WIDTHS,
  NAV_PADDING,
  NAV_SPACING,
  NAV_ICON_SIZES,
  NAV_TYPOGRAPHY,
  NAV_STATES,
  NAV_ROUNDED,
  NAV_CLASSES,
  NAV_BORDERS,
  NAV_TOGGLE_BUTTONS,
  NAV_BACKGROUNDS,
} from '@/lib/navigation-constants';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  query?: string;
  adminOnly?: boolean;
  category?: string;
}

interface NavCategory {
  name: string;
  items: NavItem[];
  adminOnly?: boolean;
}

export default function SettingsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isOpen, toggle } = useSidebarToggle('settingsNavOpen', true);
  const { isAdmin } = usePermissions();
  
  // Determine base settings path based on role
  const baseSettingsPath = isAdmin ? '/dashboard/settings/admin' : '/dashboard/settings/employee';
  
  const navCategories: NavCategory[] = [
    {
      name: 'Main Settings',
      adminOnly: false,
      items: [
        { name: 'Company & Organization', href: baseSettingsPath, icon: Building2, query: 'tab=company', category: 'Main Settings', adminOnly: true },
        { name: 'Team & Users', href: baseSettingsPath, icon: Users, query: 'tab=team', category: 'Main Settings', adminOnly: true },
        { name: 'System Configuration', href: baseSettingsPath, icon: Settings, query: 'tab=system', category: 'Main Settings', adminOnly: true },
        { name: 'General', href: baseSettingsPath, icon: Settings, category: 'Main Settings' },
        { name: 'Appearance', href: baseSettingsPath, icon: Palette, query: 'tab=appearance', category: 'Main Settings' },
        { name: 'Notifications', href: baseSettingsPath, icon: Bell, query: 'tab=notifications', category: 'Main Settings' },
        { name: 'Security & Privacy', href: baseSettingsPath, icon: Shield, query: 'tab=security', category: 'Main Settings' },
      ],
    },
    {
      name: 'Customizations',
      adminOnly: true,
      items: [
        { name: 'Customizations', href: baseSettingsPath, icon: Layers, query: 'tab=customizations', category: 'Customizations', adminOnly: true },
        { name: 'Dynamic Statuses', href: '/dashboard/settings/customizations/statuses', icon: Layers, category: 'Customizations', adminOnly: true },
        { name: 'Tag Management', href: '/dashboard/settings/customizations/tags', icon: Tag, category: 'Customizations', adminOnly: true },
        { name: 'Classifications', href: '/dashboard/settings/customizations/classifications', icon: FolderTree, category: 'Customizations', adminOnly: true },
        { name: 'Templates', href: '/dashboard/settings/customizations/templates', icon: FileText, category: 'Customizations', adminOnly: true },
        { name: 'Default Configurations', href: '/dashboard/settings/customizations/defaults', icon: Settings, category: 'Customizations', adminOnly: true },
        { name: 'Task Management Projects', href: '/dashboard/settings/customizations/tasks', icon: Layers, category: 'Customizations', adminOnly: true },
      ],
    },
    {
      name: 'Integrations & Billing',
      adminOnly: true,
      items: [
        { name: 'Integrations', href: baseSettingsPath, icon: Plug, query: 'tab=integrations', category: 'Integrations & Billing', adminOnly: true },
        { name: 'Billing & Subscription', href: baseSettingsPath, icon: CreditCard, query: 'tab=billing', category: 'Integrations & Billing', adminOnly: true },
      ],
    },
    {
      name: 'Other',
      adminOnly: false,
      items: [
        { name: 'EDI', href: '/dashboard/edi', icon: FileText, category: 'Other' },
        { name: 'MC Numbers', href: '/dashboard/mc-numbers', icon: Hash, category: 'Other' },
        { name: 'Apps & Marketplace', href: '/dashboard/apps/marketplace', icon: ShoppingBag, category: 'Other' },
      ],
    },
  ];

  // Filter categories and items based on admin status
  const visibleCategories = navCategories
    .filter(cat => !cat.adminOnly || isAdmin)
    .map(cat => ({
      ...cat,
      items: cat.items.filter(item => !item.adminOnly || isAdmin),
    }))
    .filter(cat => cat.items.length > 0);

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
        'general': isAdmin ? 'company' : 'general',
      };
      const mappedTab = tabMap[currentTab || ''] || currentTab;
      return (pathname === '/dashboard/settings/admin' || pathname === '/dashboard/settings/employee') && mappedTab === expectedTab;
    }
    
    // For settings page without query (default)
    if (item.href === baseSettingsPath && !item.query) {
      const currentTab = searchParams.get('tab');
      const defaultTab = isAdmin ? 'company' : 'general';
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
        {visibleCategories.map((category, categoryIndex) => (
          <div key={category.name} className={categoryIndex > 0 ? 'mt-6' : ''}>
            <h3 className={cn(NAV_TYPOGRAPHY.sectionHeader, 'text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2')}>
              {category.name}
            </h3>
            <div className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                
                return (
                  <button
                    key={item.name}
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
