'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Calendar,
  Building2,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  FileText,
  DollarSign,
  Search,
  RefreshCw,
  MapPin,
  ChevronDown,
  ChevronRight,
  Lock,
  Shield,
  Wrench,
  Warehouse,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Store,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import GlobalSearch from '@/components/search/GlobalSearch';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/permissions';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  badge?: string; // For "NEW" badges
}

interface NavigationGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    name: 'Load Management',
    icon: Package,
    permission: 'loads.view',
    items: [
      { name: 'All Loads', href: '/dashboard/loads', icon: Package, permission: 'loads.view' },
      { name: 'Live Loads', href: '/dashboard/loads?status=in_transit', icon: TrendingUp, permission: 'loads.view' },
      { name: 'My Loads', href: '/dashboard/loads?my=true', icon: FileText, permission: 'loads.view' },
      { name: 'Loadboard', href: '/dashboard/loadboard', icon: Search, permission: 'loads.view', badge: 'NEW' },
    ],
  },
  {
    name: 'Planning Calendar',
    icon: Calendar,
    permission: 'loads.view',
    items: [
      { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar, permission: 'loads.view' },
    ],
  },
  {
    name: 'MAP',
    icon: MapPin,
    permission: 'loads.view',
    items: [
      { name: 'Live Map', href: '/dashboard/map', icon: Navigation, permission: 'loads.view' },
    ],
  },
  {
    name: 'Accounting',
    icon: DollarSign,
    permission: 'invoices.view',
    items: [
      { name: 'Invoice', href: '/dashboard/invoices', icon: FileText, permission: 'invoices.view' },
      { name: 'Settlements', href: '/dashboard/settlements', icon: DollarSign, permission: 'settlements.view' },
      { name: 'Salary', href: '/dashboard/salary', icon: CreditCard, permission: 'settlements.view' },
      { name: 'Bill', href: '/dashboard/bills', icon: DollarSign, permission: 'invoices.view' },
    ],
  },
  {
    name: 'Customer Management',
    icon: Building2,
    permission: 'customers.view',
    items: [
      { name: 'Customers', href: '/dashboard/customers', icon: Building2, permission: 'customers.view' },
      { name: 'Vendors', href: '/dashboard/vendors', icon: Store, permission: 'customers.view' },
      { name: 'Locations', href: '/dashboard/locations', icon: MapPin, permission: 'customers.view' },
    ],
  },
  {
    name: 'Safety',
    icon: Shield,
    permission: undefined,
    items: [
      { name: 'Safety', href: '/dashboard/safety', icon: Shield, permission: undefined },
    ],
  },
  {
    name: 'Fleet Management',
    icon: Truck,
    permission: 'trucks.view',
    items: [
      { name: 'Trucks', href: '/dashboard/trucks', icon: Truck, permission: 'trucks.view' },
      { name: 'Trailers', href: '/dashboard/trailers', icon: Truck, permission: 'trucks.view' },
      { name: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench, permission: 'trucks.view' },
      { name: 'Breakdowns', href: '/dashboard/breakdowns', icon: AlertTriangle, permission: 'trucks.view' },
      { name: 'Inspections', href: '/dashboard/inspections', icon: ClipboardCheck, permission: 'trucks.view' },
      { name: 'Fleet Board', href: '/dashboard/fleet-board', icon: BarChart3, permission: 'trucks.view' },
      { name: 'Inventory', href: '/dashboard/inventory', icon: Warehouse, permission: 'trucks.view' },
    ],
  },
  {
    name: 'HR Management',
    icon: Users,
    permission: 'drivers.view',
    items: [
      { name: 'HR Management', href: '/dashboard/hr', icon: Users, permission: 'drivers.view' },
      { name: 'Drivers', href: '/dashboard/drivers', icon: Users, permission: 'drivers.view' },
    ],
  },
];

// Standalone navigation items (no submenu)
const standaloneNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: undefined },
  { name: 'Dispatch', href: '/dashboard/dispatch', icon: Calendar, permission: 'loads.assign' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, permission: 'analytics.view' },
];

// Settings group (at the end)
const settingsGroup: NavigationGroup = {
  name: 'Settings',
  icon: Settings,
  permission: 'settings.view',
  items: [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'settings.view' },
    { name: 'Automation', href: '/dashboard/automation', icon: RefreshCw, permission: 'settings.view' },
    { name: 'EDI', href: '/dashboard/edi', icon: FileText, permission: 'settings.view' },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const { can } = usePermissions();

  const toggleGroup = (groupName: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupName)) {
      newOpenGroups.delete(groupName);
    } else {
      newOpenGroups.add(groupName);
    }
    setOpenGroups(newOpenGroups);
  };

  // Filter navigation groups and items based on permissions
  let visibleGroups = navigationGroups.filter((group) => {
    if (!group.permission) return true;
    return can(group.permission);
  }).map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.permission) return true;
      return can(item.permission);
    }),
  })).filter((group) => group.items.length > 0);

  // Add Settings group at the end if user has permission
  if (settingsGroup.permission === undefined || can(settingsGroup.permission)) {
    const settingsItems = settingsGroup.items.filter((item) => {
      if (!item.permission) return true;
      return can(item.permission);
    });
    if (settingsItems.length > 0) {
      visibleGroups = [...visibleGroups, { ...settingsGroup, items: settingsItems }];
    }
  }

  const visibleStandalone = standaloneNavigation.filter((item) => {
    if (!item.permission) return true;
    return can(item.permission);
  });

  // Auto-expand groups that contain the current page
  const activeGroup = visibleGroups.find((group) =>
    group.items.some((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))
  );
  if (activeGroup && !openGroups.has(activeGroup.name)) {
    setOpenGroups(new Set([...openGroups, activeGroup.name]));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-primary p-2">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">TMS</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {/* Standalone items */}
            {visibleStandalone.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Groups with submenus */}
            {visibleGroups.map((group) => {
              const isGroupActive = group.items.some(
                (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
              );
              const isOpen = openGroups.has(group.name);

              return (
                <Collapsible
                  key={group.name}
                  open={isOpen}
                  onOpenChange={() => toggleGroup(group.name)}
                >
                  <CollapsibleTrigger
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isGroupActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <group.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{group.name}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 ml-4 space-y-1">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href || pathname?.startsWith(item.href + '/');
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            {item.href.includes('loadboard') && (
                              <Lock className="h-3 w-3" />
                            )}
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <GlobalSearch />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
