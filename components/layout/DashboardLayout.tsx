'use client';

import { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import GlobalSearch from '@/components/search/GlobalSearch';
import CompanySwitcher from '@/components/layout/CompanySwitcher';
import McViewSelector from '@/components/mc-numbers/McViewSelector';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { FontSizeToggle } from '@/components/theme/FontSizeToggle';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/permissions';
import { useSession } from 'next-auth/react';
import { getDepartmentForRoute, hasRouteAccess } from '@/lib/department-access';
import type { UserRole } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, permission: 'analytics.view' },
  { name: 'Fleet Department', href: '/dashboard/fleet', icon: Truck, permission: 'departments.fleet.view' },
  { name: 'Accounting Department', href: '/dashboard/accounting', icon: DollarSign, permission: 'departments.accounting.view' },
  { name: 'Safety Department', href: '/dashboard/safety', icon: Shield, permission: 'departments.safety.view' },
  { name: 'HR Management', href: '/dashboard/hr', icon: Users, permission: 'departments.hr.view' },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBar, permission: 'departments.reports.view' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'departments.settings.view' },
];

function UserProfileSection({ collapsed }: { collapsed?: boolean }) {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const userName = session.user.name || `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || 'User';
  const userEmail = session.user.email || '';

  if (collapsed) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="rounded-full bg-primary/20 p-2">
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

interface DashboardLayoutProps {
  children: React.ReactNode;
  hideMainNav?: boolean;
  session?: any; // Session from server component
}

export default function DashboardLayout({
  children,
  hideMainNav = false,
  session: serverSession,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  // Prefer server session if available, otherwise use client-side hook
  // This ensures we have session data even if SessionProvider has timing issues
  const clientSessionResult = useSession();
  const session = serverSession || clientSessionResult?.data || null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(false); // Default to expanded
  const [isHovering, setIsHovering] = useState(false);
  const [justManuallyToggled, setJustManuallyToggled] = useState(false);
  const { can, isAdmin } = usePermissions();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load main sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mainSidebarCollapsed');
    if (saved !== null) {
      setMainSidebarCollapsed(saved === 'true');
    } else {
      // First time - default to expanded
      setMainSidebarCollapsed(false);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Save main sidebar preference to localStorage
  const toggleMainSidebar = () => {
    const newState = !mainSidebarCollapsed;
    setMainSidebarCollapsed(newState);
    localStorage.setItem('mainSidebarCollapsed', String(newState));
  };

  // Only hide main nav if explicitly requested via hideMainNav prop
  const shouldHideMainNav = hideMainNav;

  // Check if we're in Fleet Department section (has its own sidebar)
  const isFleetSection = pathname?.startsWith('/dashboard/fleet');
  // Check if we're in Safety section (has its own sidebar)
  const isSafetySection = pathname?.startsWith('/dashboard/safety');

  // Filter navigation items based on permissions and department access
  const role = (session?.user?.role || 'CUSTOMER') as UserRole;
  const visibleNavigation = mainNavigation.filter((item) => {
    // Dashboard is always visible
    if (!item.permission) return true;
    
    // Check both the permission and department access
    const hasPermission = can(item.permission);
    const hasDeptAccess = hasRouteAccess(role, item.href);
    
    return hasPermission && hasDeptAccess;
  });

  // Debug: Log visible navigation items (only once on mount)
  useEffect(() => {
    if (session?.user) {
      console.log('[DashboardLayout] Session:', {
        role: session.user.role,
        visibleItems: visibleNavigation.map(i => i.name)
      });
    }
  }, []); // Empty deps - only log once on mount

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hide when hideMainNav is true */}
      {!shouldHideMainNav && (
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-slate-900 dark:bg-secondary text-slate-100 dark:text-foreground transform transition-all duration-300 ease-in-out',
          // Mobile: slide in/out
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, just change width
          'lg:translate-x-0',
          mainSidebarCollapsed ? 'w-16 lg:w-16' : 'w-64 lg:w-64'
        )}
        onMouseEnter={() => {
          // Clear any pending collapse timeout
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          
          setIsHovering(true);
          
          // Don't auto-expand if user just manually collapsed
          if (justManuallyToggled) {
            return;
          }
          
          // Auto-expand on hover when collapsed (unless manually locked)
          if (mainSidebarCollapsed) {
            const manualLock = localStorage.getItem('mainSidebarManuallyLocked');
            if (!manualLock || manualLock === 'false') {
              setMainSidebarCollapsed(false);
            }
          }
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          
          // Auto-collapse after 10 seconds when mouse leaves (unless manually locked)
          const manualLock = localStorage.getItem('mainSidebarManuallyLocked');
          if (!manualLock || manualLock === 'false') {
            // Clear any existing timeout
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            
            // Set new timeout for 10 seconds
            hoverTimeoutRef.current = setTimeout(() => {
              setMainSidebarCollapsed(true);
              hoverTimeoutRef.current = null;
            }, 10000); // 10 seconds
          }
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 dark:border-border">
            <div className={cn(
              'flex items-center space-x-2 transition-opacity',
              mainSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}>
              <div className="rounded-lg bg-primary p-2">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg dark:text-foreground whitespace-nowrap">TMS</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex text-slate-300 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-slate-800 dark:hover:bg-accent"
                onClick={() => {
                  // Clear any pending timeout
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                  
                  const newState = !mainSidebarCollapsed;
                  setMainSidebarCollapsed(newState);
                  localStorage.setItem('mainSidebarCollapsed', String(newState));
                  
                  // Mark as manually toggled to prevent immediate hover re-expansion
                  setJustManuallyToggled(true);
                  
                  // Toggle lock state - if expanding manually, lock it open; if collapsing, unlock for hover
                  if (!newState) {
                    // Expanding - lock it open
                    localStorage.setItem('mainSidebarManuallyLocked', 'true');
                  } else {
                    // Collapsing - unlock for hover behavior, but prevent immediate re-expansion
                    localStorage.setItem('mainSidebarManuallyLocked', 'false');
                    // Reset the flag after a short delay to allow hover behavior again
                    setTimeout(() => {
                      setJustManuallyToggled(false);
                    }, 500); // 500ms delay before hover can expand again
                  }
                  
                  // Reset flag when expanding
                  if (!newState) {
                    setTimeout(() => {
                      setJustManuallyToggled(false);
                    }, 100);
                  }
                }}
                title={mainSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {mainSidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-300 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-slate-800 dark:hover:bg-accent"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            <TooltipProvider delayDuration={300}>
              {visibleNavigation.map((item) => {
                // Get settings URL based on role
                const settingsUrl = item.href === '/dashboard/settings' 
                  ? (isAdmin ? '/dashboard/settings/admin' : '/dashboard/settings/employee')
                  : item.href;
                
                // Dashboard should only be active when exactly on /dashboard, not sub-routes
                // Other items can be active when on the exact route or sub-routes
                const isActive = item.href === '/dashboard' 
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname?.startsWith(item.href + '/');
                
                const navItem = (
                  <Link
                    key={item.name}
                    href={settingsUrl}
                    className={cn(
                      'flex items-center rounded-lg text-sm font-medium transition-colors',
                      mainSidebarCollapsed ? 'justify-center px-2 py-2' : 'space-x-3 px-3 py-2',
                      isActive
                        ? 'bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground'
                        : 'text-slate-300 dark:text-foreground/70 hover:bg-slate-800 dark:hover:bg-accent hover:text-white dark:hover:text-foreground'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!mainSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );

                if (mainSidebarCollapsed) {
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        {navItem}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return navItem;
              })}
            </TooltipProvider>
          </nav>

          {/* Company Switcher - Hidden when collapsed */}
          {!mainSidebarCollapsed && <CompanySwitcher />}

          {/* User Profile & Logout */}
          <div className={cn(
            'border-t border-slate-800 dark:border-border space-y-2 transition-opacity',
            mainSidebarCollapsed ? 'p-2' : 'p-4'
          )}>
            {/* User Profile */}
            <UserProfileSection collapsed={mainSidebarCollapsed} />
            
            {/* Logout */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full transition-colors text-slate-300 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-slate-800 dark:hover:bg-accent',
                      mainSidebarCollapsed ? 'justify-center px-2' : 'justify-start'
                    )}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const basePath = typeof window !== 'undefined'
                          ? (process.env.NEXT_PUBLIC_BASE_PATH || '')
                          : '';
                        const loginPath = basePath ? `${basePath}/login` : '/login';
                        await signOut({ 
                          redirect: false,
                          callbackUrl: loginPath 
                        });
                        // Force navigation even if signOut fails
                        window.location.href = loginPath;
                      } catch (error) {
                        console.error('Logout error:', error);
                        // Force navigation on error
                        const basePath = typeof window !== 'undefined'
                          ? (process.env.NEXT_PUBLIC_BASE_PATH || '')
                          : '';
                        const loginPath = basePath ? `${basePath}/login` : '/login';
                        window.location.href = loginPath;
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    {!mainSidebarCollapsed && <span className="ml-3">Sign Out</span>}
                  </Button>
                </TooltipTrigger>
                {mainSidebarCollapsed && (
                  <TooltipContent side="right">
                    <p>Sign Out</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </aside>
      )}

      {/* Main content */}
      <div className={cn(
        !shouldHideMainNav && mainSidebarCollapsed && 'lg:pl-16',
        !shouldHideMainNav && !mainSidebarCollapsed && 'lg:pl-64'
      )}>
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
            <div className="flex items-center gap-3">
              <McViewSelector />
              <div className="h-6 w-px bg-border" />
              <GlobalSearch />
              <FontSizeToggle />
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
