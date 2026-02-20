'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  Truck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import GlobalSearch from '@/components/search/GlobalSearch';
import McViewSelector from '@/components/mc-numbers/McViewSelector';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { FontSizeToggle } from '@/components/theme/FontSizeToggle';
import { useSession } from 'next-auth/react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import AppVersionBadge from '@/components/layout/AppVersionBadge';
import SidebarNav from '@/components/layout/SidebarNav';
import { DepartmentNav } from '@/components/layout/DepartmentNav';
import {
  loadNavItems,
  fleetNavItems,
  safetyNavItems,
  accountingNavItems,
  hrNavItems,
  crmNavItems,
  analyticsNavItems,
} from '@/lib/config/department-nav';
import AIAssistantChat from '@/components/ai/AIAssistantChat';
import { SmsMessengerProvider, useSmsMessenger } from '@/lib/contexts/SmsMessengerContext';
import LeadSmsMessenger from '@/components/crm/LeadSmsMessenger';
import { SoftphoneProvider } from '@/lib/contexts/SoftphoneContext';
import Softphone from '@/components/communications/Softphone';


function SmsMessengerOverlay() {
  const { activeLead, closeSmsMessenger } = useSmsMessenger();
  return <LeadSmsMessenger lead={activeLead} onClose={closeSmsMessenger} />;
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

  return (
    <SoftphoneProvider>
    <SmsMessengerProvider>
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
            'fixed top-0 left-0 z-50 h-full bg-secondary text-secondary-foreground border-r border-border/50 shadow-lg transform transition-all duration-300 ease-in-out',
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
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-accent/10"
                      onClick={toggleMainSidebarAlwaysShow}
                    >
                      {mainSidebarAlwaysShow ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
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
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                  const newState = !mainSidebarCollapsed;
                  setMainSidebarCollapsed(newState);
                  localStorage.setItem('mainSidebarCollapsed', String(newState));
                  setJustManuallyToggled(true);
                  if (!mainSidebarAlwaysShow) {
                    localStorage.setItem('mainSidebarManuallyLocked', newState ? 'false' : 'true');
                    setTimeout(() => setJustManuallyToggled(false), newState ? 500 : 100);
                  } else {
                    setTimeout(() => setJustManuallyToggled(false), 100);
                  }
                }}
                title={mainSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {mainSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
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

          {/* Grouped Navigation + User Profile + Logout */}
          <SidebarNav
            collapsed={mainSidebarCollapsed}
            onItemClick={() => setSidebarOpen(false)}
          />
          <AppVersionBadge collapsed={mainSidebarCollapsed} />
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
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 dark:bg-card/80">
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
            {isLoadManagementSection && <DepartmentNav items={loadNavItems} basePath="/dashboard/loads" />}
            {isFleetSection && <DepartmentNav items={fleetNavItems} basePath="/dashboard/fleet" />}
            {isSafetySection && <DepartmentNav items={safetyNavItems} basePath="/dashboard/safety" />}
            {isAccountingSection && <DepartmentNav items={accountingNavItems} />}
            {isHRSection && <DepartmentNav items={hrNavItems} basePath="/dashboard/hr" />}
            {isCRMSection && <DepartmentNav items={crmNavItems} basePath="/dashboard/crm" />}
            {isAnalyticsSection && <DepartmentNav items={analyticsNavItems} basePath="/dashboard/analytics" />}


            <div className="flex-1 min-w-0" />
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <McViewSelector />
              <div className="hidden sm:block h-6 w-px bg-border" />
              <GlobalSearch />
              <div className="hidden sm:block"><FontSizeToggle /></div>
              <div className="hidden sm:block"><ThemeToggle /></div>
              <NotificationBell />
              {/* Help & Support Toggle in Header */}
              <Button
                variant="outline"
                onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                className={cn(
                  "gap-2 h-9 px-3 text-sm font-medium transition-colors border-primary/30",
                  isAiChatOpen
                    ? "bg-primary/10 text-primary border-primary/50"
                    : "hover:bg-primary/5 hover:border-primary/40"
                )}
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Help & Support</span>
              </Button>
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
        <SmsMessengerOverlay />
        <Softphone />
      </div>
    </div>
    </SmsMessengerProvider>
    </SoftphoneProvider>
  );
}
