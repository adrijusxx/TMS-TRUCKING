'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Calendar,
  BarChart3,
  Settings,
  DollarSign,
  Shield,
  ChartBar,
  UserPlus,
  Key,
  History,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/permissions';
import { hasRouteAccess } from '@/lib/department-access';
import { MenuVisibilityManager } from '@/lib/managers/MenuVisibilityManager';
import type { MenuItemId } from '@/lib/managers/MenuVisibilityManager';
import { signOut, useSession } from 'next-auth/react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  activePaths?: string[];
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Loads', href: '/dashboard/loads', icon: Package, permission: 'loads.view' },
      { name: 'Dispatch', href: '/dashboard/dispatch', icon: Calendar, permission: 'loads.view' },
    ],
  },
  {
    label: 'Departments',
    items: [
      { name: 'Fleet', href: '/dashboard/fleet', icon: Truck, permission: 'departments.fleet.view' },
      { name: 'Safety', href: '/dashboard/safety', icon: Shield, permission: 'departments.safety.view' },
      { name: 'Accounting', href: '/dashboard/invoices', icon: DollarSign, permission: 'departments.accounting.view', activePaths: ['/dashboard/invoices', '/dashboard/settlements', '/dashboard/customers', '/dashboard/batches', '/dashboard/accounting'] },
      { name: 'HR', href: '/dashboard/hr', icon: Users, permission: 'departments.hr.view' },
      { name: 'Recruiting', href: '/dashboard/crm', icon: UserPlus, permission: 'departments.crm.view' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, permission: 'analytics.view' },
      { name: 'Reports', href: '/dashboard/reports', icon: ChartBar, permission: 'departments.reports.view' },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'departments.settings.view' },
    ],
  },
];

const superAdminNavigation: NavigationItem[] = [
  { name: 'Super Admin', href: '/dashboard/super-admin', icon: Shield },
  { name: 'API Keys', href: '/dashboard/super-admin/api-keys', icon: Key },
  { name: 'Audit Logs', href: '/dashboard/super-admin/audit', icon: History },
];

function UserProfileSection({ collapsed }: { collapsed?: boolean }) {
  const { data: session } = useSession();
  if (!session?.user) return null;

  const userName = session.user.name || `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || 'User';
  const userEmail = session.user.email || '';

  if (collapsed) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="rounded-full bg-accent/20 p-2">
          <Users className="h-4 w-4 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 px-2 py-2">
      <div className="rounded-full bg-primary/20 p-2">
        <Users className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{userName}</div>
        <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
      </div>
    </div>
  );
}

interface SidebarNavProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

export default function SidebarNav({ collapsed, onItemClick }: SidebarNavProps) {
  const pathname = usePathname();
  const { can, isAdmin } = usePermissions();
  const { data: session } = useSession();
  const role = session?.user?.role || 'CUSTOMER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  // Filter groups by permissions
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permission) return true;
        const hasPermission = can(item.permission);
        const hasDeptAccess = hasRouteAccess(role, item.href);
        const baseVisibility = hasPermission && hasDeptAccess;
        return MenuVisibilityManager.isMenuItemVisible(
          item.href as MenuItemId,
          role,
          baseVisibility
        );
      }),
    }))
    .filter((group) => group.items.length > 0);

  const renderNavItem = (item: NavigationItem, variant: 'default' | 'super-admin' = 'default') => {
    const settingsUrl = item.href === '/dashboard/settings'
      ? (isAdmin ? '/dashboard/settings/admin' : '/dashboard/settings/employee')
      : item.href;

    const isActive = item.href === '/dashboard'
      ? pathname === '/dashboard'
      : item.activePaths
        ? item.activePaths.some(p => pathname === p || pathname?.startsWith(p + '/'))
        : pathname === item.href || pathname?.startsWith(item.href + '/');

    const activeStyles = variant === 'super-admin'
      ? 'bg-status-error text-status-error-foreground shadow-sm shadow-status-error/20'
      : 'bg-primary text-primary-foreground shadow-sm shadow-primary/20';

    const hoverStyles = variant === 'super-admin'
      ? 'text-muted-foreground hover:bg-status-error/10 hover:text-status-error'
      : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground';

    const navLink = (
      <Link
        key={item.name}
        href={settingsUrl}
        className={cn(
          'flex items-center rounded-lg text-sm font-medium transition-colors',
          collapsed ? 'justify-center px-2 py-2' : 'space-x-3 px-3 py-2',
          isActive ? activeStyles : hoverStyles
        )}
        onClick={onItemClick}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
          <TooltipContent side="right"><p>{item.name}</p></TooltipContent>
        </Tooltip>
      );
    }

    return navLink;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <TooltipProvider delayDuration={300}>
          {visibleGroups.map((group, idx) => (
            <div key={group.label}>
              {!collapsed && (
                <div className={cn(
                  'px-3 pb-1 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider',
                  idx === 0 ? 'pt-1' : 'pt-4'
                )}>
                  {group.label}
                </div>
              )}
              {collapsed && idx > 0 && (
                <div className="my-2 mx-2 h-px bg-border/30" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}

          {/* Super Admin Section */}
          {isSuperAdmin && (
            <>
              {!collapsed && (
                <div className="px-3 py-2 mt-4 text-xs font-semibold text-status-error/80 uppercase tracking-wider">
                  Super Admin
                </div>
              )}
              {collapsed && <div className="my-2 mx-2 h-px bg-status-error/30" />}
              <div className="space-y-0.5">
                {superAdminNavigation.map((item) => renderNavItem(item, 'super-admin'))}
              </div>
            </>
          )}
        </TooltipProvider>
      </nav>

      {/* User Profile & Logout */}
      <div className={cn(
        'border-t border-slate-800 dark:border-border space-y-2 transition-opacity',
        collapsed ? 'p-2' : 'p-4'
      )}>
        <UserProfileSection collapsed={collapsed} />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/10',
                  collapsed ? 'justify-center px-2' : 'justify-start'
                )}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const basePath = typeof window !== 'undefined'
                      ? (process.env.NEXT_PUBLIC_BASE_PATH || '')
                      : '';
                    const loginPath = basePath ? `${basePath}/login` : '/login';
                    await signOut({ redirect: false, callbackUrl: loginPath });
                    window.location.href = loginPath;
                  } catch (error) {
                    console.error('Logout error:', error);
                    const basePath = typeof window !== 'undefined'
                      ? (process.env.NEXT_PUBLIC_BASE_PATH || '')
                      : '';
                    window.location.href = basePath ? `${basePath}/login` : '/login';
                  }
                }}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="ml-3">Sign Out</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right"><p>Sign Out</p></TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
