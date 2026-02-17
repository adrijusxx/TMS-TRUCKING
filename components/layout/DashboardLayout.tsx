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
  Container,
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
  Pin,
  PinOff,
  History,
  Key,
  Bot,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import GlobalSearch from '@/components/search/GlobalSearch';
import McViewSelector from '@/components/mc-numbers/McViewSelector';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { FontSizeToggle } from '@/components/theme/FontSizeToggle';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/permissions';
import { useSession } from 'next-auth/react';
import { getDepartmentForRoute, hasRouteAccess } from '@/lib/department-access';
import type { UserRole } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MenuVisibilityManager } from '@/lib/managers/MenuVisibilityManager';
import type { MenuItemId } from '@/lib/managers/MenuVisibilityManager';
import SafetyHeaderNav from '@/components/safety/SafetyHeaderNav';
import AccountingHeaderNav from '@/components/accounting/AccountingHeaderNav';
import FleetHeaderNav from '@/components/fleet/FleetHeaderNav';
import LoadHeaderNav from '@/components/loads/LoadHeaderNav';
import HRHeaderNav from '@/components/hr/HRHeaderNav';
import CRMHeaderNav from '@/components/crm/CRMHeaderNav';
import AnalyticsHeaderNav from '@/components/analytics/AnalyticsHeaderNav';
import AIAssistantChat from '@/components/ai/AIAssistantChat';


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
  { name: 'Fleet Department', href: '/dashboard/fleet', icon: Truck, permission: 'departments.fleet.view' },
  // Fleet sub-items (visible if user has permission but NOT fleet department view)
  { name: 'Trucks', href: '/dashboard/trucks', icon: Truck, permission: 'trucks.view' },
  { name: 'Trailers', href: '/dashboard/trailers', icon: Container, permission: 'trailers.view' },
  { name: 'Breakdowns', href: '/dashboard/fleet/breakdowns', icon: AlertTriangle, permission: 'breakdowns.view' },
  { name: 'Accounting Department', href: '/dashboard/accounting', icon: DollarSign, permission: 'departments.accounting.view' },
  { name: 'Safety Department', href: '/dashboard/safety', icon: Shield, permission: 'departments.safety.view' },
  { name: 'HR Management', href: '/dashboard/hr', icon: Users, permission: 'departments.hr.view' },
  { name: 'Recruitment', href: '/dashboard/crm', icon: UserPlus, permission: 'departments.crm.view' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, permission: 'analytics.view' },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBar, permission: 'departments.reports.view' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'departments.settings.view' },
];

// Super Admin navigation (only visible to SUPER_ADMIN role)
const superAdminNavigation: NavigationItem[] = [
  { name: 'Super Admin Dashboard', href: '/dashboard/super-admin', icon: Shield, permission: undefined },
  { name: 'API Keys', href: '/dashboard/super-admin/api-keys', icon: Key, permission: undefined },
  { name: 'Audit Logs', href: '/dashboard/super-admin/audit', icon: History, permission: undefined },
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
        <div className="text-sm font-medium text-foreground truncate">
          {userName}
        </div>
        <div className="text-xs text-muted-foreground truncate">
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
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(false); // Default to expanded
  const [mainSidebarHidden, setMainSidebarHidden] = useState(false); // Toggle to completely hide/show
  const [mainSidebarAlwaysShow, setMainSidebarAlwaysShow] = useState(false); // Toggle to always show vs auto-hide
  const [isHovering, setIsHovering] = useState(false);
  const [justManuallyToggled, setJustManuallyToggled] = useState(false);
  const { can, isAdmin } = usePermissions();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load main sidebar preferences from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('mainSidebarCollapsed');
    const savedHidden = localStorage.getItem('mainSidebarHidden');
    const savedAlwaysShow = localStorage.getItem('mainSidebarAlwaysShow');

    if (savedCollapsed !== null) {
      setMainSidebarCollapsed(savedCollapsed === 'true');
    } else {
      // First time - default to expanded
      setMainSidebarCollapsed(false);
    }

    if (savedHidden !== null) {
      setMainSidebarHidden(savedHidden === 'true');
    } else {
      // First time - default to visible
      setMainSidebarHidden(false);
    }

    if (savedAlwaysShow !== null) {
      setMainSidebarAlwaysShow(savedAlwaysShow === 'true');
    } else {
      // First time - default to auto-hide (current behavior)
      setMainSidebarAlwaysShow(false);
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

  // When "always show" is enabled, ensure sidebar stays expanded and clear any pending timeouts
  useEffect(() => {
    if (mainSidebarAlwaysShow) {
      // Clear any pending collapse timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      // Ensure sidebar is expanded
      if (mainSidebarCollapsed) {
        setMainSidebarCollapsed(false);
        localStorage.setItem('mainSidebarCollapsed', 'false');
      }
      // Lock it open
      localStorage.setItem('mainSidebarManuallyLocked', 'true');
    }
  }, [mainSidebarAlwaysShow, mainSidebarCollapsed]);

  // Save main sidebar preference to localStorage
  const toggleMainSidebar = () => {
    const newState = !mainSidebarCollapsed;
    setMainSidebarCollapsed(newState);
    localStorage.setItem('mainSidebarCollapsed', String(newState));
  };

  // Toggle to completely hide/show sidebar
  const toggleMainSidebarVisibility = () => {
    const newState = !mainSidebarHidden;
    setMainSidebarHidden(newState);
    localStorage.setItem('mainSidebarHidden', String(newState));
  };

  // Toggle to always show vs auto-hide after 10 seconds
  const toggleMainSidebarAlwaysShow = () => {
    const newState = !mainSidebarAlwaysShow;
    setMainSidebarAlwaysShow(newState);
    localStorage.setItem('mainSidebarAlwaysShow', String(newState));

    // If enabling "always show", clear any pending timeout and ensure sidebar is expanded
    if (newState) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      // Lock it open
      localStorage.setItem('mainSidebarManuallyLocked', 'true');
      setMainSidebarCollapsed(false);
      localStorage.setItem('mainSidebarCollapsed', 'false');
    } else {
      // If disabling "always show", unlock for auto-hide behavior
      localStorage.setItem('mainSidebarManuallyLocked', 'false');
    }
  };

  // Hide main nav if explicitly requested via hideMainNav prop
  // Note: mainSidebarHidden only affects desktop, mobile always allows sidebar
  const shouldHideMainNav = hideMainNav;

  // Check if we're in Load Management section
  const isLoadManagementSection = pathname?.startsWith('/dashboard/loads') ||
    pathname?.startsWith('/dashboard/loadboard') ||
    pathname?.startsWith('/dashboard/dispatch') ||
    pathname?.startsWith('/dashboard/calendar') ||
    pathname?.startsWith('/dashboard/map') ||
    pathname?.startsWith('/dashboard/operations');

  // Check if we're in HR Management section
  const isHRSection = pathname?.startsWith('/dashboard/hr') ||
    pathname?.startsWith('/dashboard/drivers');

  // Check if we're in Fleet Department section
  const isFleetSection = pathname?.startsWith('/dashboard/fleet') ||
    pathname?.startsWith('/dashboard/trucks') ||
    pathname?.startsWith('/dashboard/trailers') ||
    pathname?.startsWith('/dashboard/fleet-board');

  // Check if we're in Accounting section
  const isAccountingSection = pathname?.startsWith('/dashboard/invoices') ||
    pathname?.startsWith('/dashboard/settlements') ||
    pathname?.startsWith('/dashboard/customers') ||
    pathname?.startsWith('/dashboard/vendors') ||
    pathname?.startsWith('/dashboard/locations') ||
    pathname?.startsWith('/dashboard/automation') ||
    pathname?.startsWith('/dashboard/accounting') ||
    pathname?.startsWith('/dashboard/batches');
  // Check if we're in Safety section
  const isSafetySection = pathname?.startsWith('/dashboard/safety');

  // Check if we're in CRM section
  const isCRMSection = pathname?.startsWith('/dashboard/crm');

  // Check if we're in Analytics section
  const isAnalyticsSection = pathname?.startsWith('/dashboard/analytics');





  // Filter navigation items based on permissions, department access, and menu visibility config




  // Filter navigation items based on permissions, department access, and menu visibility config
  const role = (session?.user?.role || 'CUSTOMER') as UserRole;
  // Fetch onboarding status to show/hide the link


  const visibleNavigation = mainNavigation.filter((item) => {
    // Dashboard is always visible
    if (!item.permission) return true;

    // Special handling for Fleet sub-items
    // If user has access to full Fleet Department, hide individual Truck/Trailer links to avoid clutter
    if (['Trucks', 'Trailers', 'Breakdowns'].includes(item.name)) {
      const hasFleetDeptAccess = can('departments.fleet.view');
      if (hasFleetDeptAccess) return false;
    }

    // Check both the permission and department access
    const hasPermission = can(item.permission);
    const hasDeptAccess = hasRouteAccess(role, item.href);
    const baseVisibility = hasPermission && hasDeptAccess;

    // Apply menu visibility configuration
    const menuVisibility = MenuVisibilityManager.isMenuItemVisible(
      item.href as MenuItemId,
      role,
      baseVisibility
    );

    return menuVisibility;
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hide when hideMainNav is true, or when mainSidebarHidden is true on desktop */}
      {!shouldHideMainNav && (
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 h-full bg-secondary text-secondary-foreground border-r border-border transform transition-all duration-300 ease-in-out',
            // Mobile: slide in/out (always available)
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            // Desktop: hide if mainSidebarHidden is true, otherwise show
            mainSidebarHidden ? 'lg:-translate-x-full' : 'lg:translate-x-0',
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

            // Auto-expand on hover when collapsed (unless manually locked or "always show" is enabled)
            if (mainSidebarCollapsed && !mainSidebarAlwaysShow) {
              const manualLock = localStorage.getItem('mainSidebarManuallyLocked');
              if (!manualLock || manualLock === 'false') {
                setMainSidebarCollapsed(false);
              }
            }
          }}
          onMouseLeave={() => {
            setIsHovering(false);

            // Only auto-collapse if "always show" is disabled
            if (!mainSidebarAlwaysShow) {
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
            }
          }}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-border">
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
                {/* Always Show / Auto-Hide Toggle */}
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-accent/10"
                        onClick={toggleMainSidebarAlwaysShow}
                      >
                        {mainSidebarAlwaysShow ? (
                          <Pin className="h-4 w-4" />
                        ) : (
                          <PinOff className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{mainSidebarAlwaysShow ? 'Always show (click to auto-hide)' : 'Auto-hide after 10s (click to always show)'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-accent/10"
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
                    // But only if "always show" is disabled
                    if (!mainSidebarAlwaysShow) {
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
                  className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent/10"
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
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
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

                {/* Super Admin Section - Only for SUPER_ADMIN role */}
                {session?.user?.role === 'SUPER_ADMIN' && (
                  <>
                    {!mainSidebarCollapsed && (
                      <div className="px-3 py-2 mt-4 text-xs font-semibold text-status-error/80 uppercase tracking-wider">
                        System
                      </div>
                    )}
                    {superAdminNavigation.map((item) => {
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                      const navItem = (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center rounded-lg text-sm font-medium transition-colors',
                            mainSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2',
                            isActive
                              ? 'bg-status-error text-status-error-foreground shadow-sm shadow-status-error/20'
                              : 'text-muted-foreground hover:bg-status-error/10 hover:text-status-error'
                          )}
                        >
                          <item.icon className={cn('flex-shrink-0', mainSidebarCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3')} />
                          {!mainSidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                      );

                      if (mainSidebarCollapsed) {
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                            <TooltipContent side="right">{item.name}</TooltipContent>
                          </Tooltip>
                        );
                      }

                      return navItem;
                    })}
                  </>
                )}
              </TooltipProvider>
            </nav>


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
                        'w-full transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/10',
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
        shouldHideMainNav && 'lg:pl-0',
        !shouldHideMainNav && mainSidebarHidden && 'lg:pl-0',
        !shouldHideMainNav && !mainSidebarHidden && mainSidebarCollapsed && 'lg:pl-16',
        !shouldHideMainNav && !mainSidebarHidden && !mainSidebarCollapsed && 'lg:pl-64'
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background border-b border-border dark:bg-card">
          <div className="flex items-center gap-2 px-4 py-3 header-container">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Toggle sidebar visibility button (desktop only) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex flex-shrink-0"
              onClick={toggleMainSidebarVisibility}
              title={mainSidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Department Header Navigation - shown only on respective routes */}
            {isLoadManagementSection && (
              <>
                <LoadHeaderNav />
                <div className="h-6 w-px bg-border flex-shrink-0" />
              </>
            )}
            {isHRSection && (
              <>
                <HRHeaderNav />
                <div className="h-6 w-px bg-border flex-shrink-0" />
              </>
            )}
            {isSafetySection && (
              <>
                <SafetyHeaderNav />
                <div className="h-6 w-px bg-border flex-shrink-0" />
              </>
            )}
            {isAccountingSection && (
              <>
                <AccountingHeaderNav />
                <div className="h-6 w-px bg-border flex-shrink-0" />
              </>
            )}
            {isFleetSection && (
              <>
                <FleetHeaderNav />
                <div className="h-6 w-px bg-border flex-shrink-0" />
              </>
            )}
            {isCRMSection && (
              <>
                <CRMHeaderNav />
                <div className="h-6 w-px bg-border flex-shrink-0" />
              </>
            )}
            {isAnalyticsSection && (
              <>
                <AnalyticsHeaderNav />
                <div className="h-6 w-px bg-border flex-shrink-0" />
              </>
            )}


            <div className="flex-1 min-w-0" />
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <McViewSelector />
              <div className="hidden sm:block h-6 w-px bg-border" />
              <GlobalSearch />
              <div className="hidden sm:block"><FontSizeToggle /></div>
              <div className="hidden sm:block"><ThemeToggle /></div>
              <NotificationBell />
              {/* AI Assistant Toggle in Header */}
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                      className={cn(
                        "transition-colors",
                        isAiChatOpen && "bg-primary/10 text-primary"
                      )}
                    >
                      <Bot className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>AI Assistant</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-2 sm:p-3 lg:p-4">{children}</main>
        <AIAssistantChat
          isOpen={isAiChatOpen}
          onOpenChange={setIsAiChatOpen}
          hideTrigger={true}
        />

      </div>
    </div>
  );
}
