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
  Shield,
  Wrench,
  Warehouse,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Store,
  Navigation,
  Hash,
  Grid,
  Tag,
  Palette,
  Sliders,
  Layers,
  FileCheck,
  ChartBar,
  Network,
  Calculator,
  Box,
  FolderTree,
  Plug,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import GlobalSearch from '@/components/search/GlobalSearch';
import CompanySwitcher from '@/components/layout/CompanySwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/permissions';
import { useSession } from 'next-auth/react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  badge?: string; // For "NEW" badges
}

// Main navigation items (no submenus)
const mainNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: undefined },
  { name: 'Load Management', href: '/dashboard/loads', icon: Package, permission: 'loads.view' },
  { name: 'Accounting', href: '/dashboard/invoices', icon: DollarSign, permission: 'invoices.view' },
  { name: 'Safety', href: '/dashboard/safety', icon: Shield, permission: undefined },
  { name: 'Fleet Management', href: '/dashboard/trucks', icon: Truck, permission: 'trucks.view' },
  { name: 'HR Management', href: '/dashboard/hr', icon: Users, permission: 'drivers.view' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'settings.view' },
];

function UserProfileSection() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const userName = session.user.name || `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || 'User';
  const userEmail = session.user.email || '';

  return (
    <div className="flex items-center space-x-3 px-2 py-2">
      <div className="rounded-full bg-primary/20 p-2">
        <Users className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200 dark:text-foreground truncate">
          {userName}
        </div>
        <div className="text-xs text-slate-400 dark:text-muted-foreground truncate">
          {userEmail}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { can } = usePermissions();

  // Filter navigation items based on permissions
  const visibleNavigation = mainNavigation.filter((item) => {
    if (!item.permission) return true;
    return can(item.permission);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
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
          'fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 dark:bg-secondary text-slate-100 dark:text-foreground transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 dark:border-border">
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-primary p-2">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg dark:text-foreground">TMS</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-300 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-slate-800 dark:hover:bg-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {visibleNavigation.map((item) => {
              // Dashboard should only be active when exactly on /dashboard, not sub-routes
              // Other items can be active when on the exact route or sub-routes
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground'
                      : 'text-slate-300 dark:text-foreground/70 hover:bg-slate-800 dark:hover:bg-accent hover:text-white dark:hover:text-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Company Switcher */}
          <CompanySwitcher />

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-800 dark:border-border space-y-2">
            {/* User Profile */}
            <UserProfileSection />
            
            {/* Logout */}
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-slate-800 dark:hover:bg-accent"
              onClick={async () => {
                // Get basePath from current location
                const basePath = typeof window !== 'undefined' 
                  ? (window.location.pathname.startsWith('/tms') ? '/tms' 
                      : window.location.pathname.startsWith('/crm') ? '/crm' 
                      : '')
                  : '';
                const loginPath = `${basePath}/login`;
                // Use redirect: false and handle redirect manually to ensure it works
                await signOut({ 
                  redirect: false,
                  callbackUrl: loginPath 
                });
                // Manually redirect to ensure it works
                window.location.href = loginPath;
              }}
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
        <header className="sticky top-0 z-30 bg-background border-b border-border dark:bg-card">
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
              <ThemeToggle />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
