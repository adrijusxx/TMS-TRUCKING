'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LoadManagementNav from '@/components/loads/LoadManagementNav';
import AccountingNav from '@/components/accounting/AccountingNav';
import SafetyNav from '@/components/safety/SafetyNav';
import FleetManagementNav from '@/components/fleet/FleetManagementNav';
import HRManagementNav from '@/components/hr/HRManagementNav';
import SettingsNav from '@/components/settings/SettingsNav';

export default function SideNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);

  // Load side nav preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sideNavOpen');
    if (saved !== null) {
      setIsSideNavOpen(saved === 'true');
    }
  }, []);

  // Save side nav preference to localStorage
  const toggleSideNav = () => {
    const newState = !isSideNavOpen;
    setIsSideNavOpen(newState);
    localStorage.setItem('sideNavOpen', String(newState));
  };

  // Determine which side nav to show based on pathname
  const getSideNav = () => {
    // Load Management pages
    if (pathname.startsWith('/dashboard/loads') || 
        pathname.startsWith('/dashboard/loadboard') ||
        pathname.startsWith('/dashboard/dispatch') ||
        pathname.startsWith('/dashboard/calendar') ||
        pathname.startsWith('/dashboard/map')) {
      return <LoadManagementNav />;
    }

    // Accounting pages (including batches)
    if (pathname.startsWith('/dashboard/invoices') ||
        pathname.startsWith('/dashboard/settlements') ||
        pathname.startsWith('/dashboard/salary') ||
        pathname.startsWith('/dashboard/bills') ||
        pathname.startsWith('/dashboard/customers') ||
        pathname.startsWith('/dashboard/vendors') ||
        pathname.startsWith('/dashboard/locations') ||
        pathname.startsWith('/dashboard/analytics') ||
        pathname.startsWith('/dashboard/automation') ||
        pathname.startsWith('/dashboard/accounting') ||
        pathname.startsWith('/dashboard/batches')) {
      return <AccountingNav />;
    }

    // Safety pages
    if (pathname.startsWith('/dashboard/safety') ||
        pathname.startsWith('/dashboard/documents')) {
      return <SafetyNav />;
    }
    
    // Reports pages
    if (pathname.startsWith('/dashboard/reports')) {
      return null; // Reports uses its own layout
    }

    // Settings pages
    if (pathname.startsWith('/dashboard/settings') ||
        pathname.startsWith('/dashboard/edi') ||
        pathname.startsWith('/dashboard/mc-numbers') ||
        pathname.startsWith('/dashboard/apps')) {
      return <SettingsNav />;
    }

    // Fleet Management pages
    if (pathname.startsWith('/dashboard/trucks') ||
        pathname.startsWith('/dashboard/trailers') ||
        pathname.startsWith('/dashboard/maintenance') ||
        pathname.startsWith('/dashboard/breakdowns') ||
        pathname.startsWith('/dashboard/inspections') ||
        pathname.startsWith('/dashboard/fleet-board') ||
        pathname.startsWith('/dashboard/inventory')) {
      return <FleetManagementNav />;
    }

    // HR Management pages
    if (pathname.startsWith('/dashboard/hr') ||
        pathname.startsWith('/dashboard/drivers')) {
      return <HRManagementNav />;
    }


    // Dashboard - no side nav
    return null;
  };

  const sideNav = getSideNav();

  if (!sideNav) {
    return <>{children}</>;
  }

  return (
    <div className="flex gap-2 relative">
      {isSideNavOpen && (
        <div className="shrink-0">
          {sideNav}
        </div>
      )}
      <div className="flex-1 min-w-0 relative">
        {/* Toggle button - positioned at top right of content area with spacing */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-4 gap-2 shadow-sm border bg-background hover:bg-accent"
            onClick={toggleSideNav}
            title={isSideNavOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isSideNavOpen ? (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Hide Menu</span>
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Show Menu</span>
              </>
            )}
          </Button>
        </div>
        {/* Add padding to prevent content overlap with toggle button */}
        <div className="pt-12 pr-4">
          {children}
        </div>
      </div>
    </div>
  );
}
