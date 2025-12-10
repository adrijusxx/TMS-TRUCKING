'use client';

import { usePathname } from 'next/navigation';
import LoadManagementNav from '@/components/loads/LoadManagementNav';
import AccountingNav from '@/components/accounting/AccountingNav';
import SafetyNav from '@/components/safety/SafetyNav';
import HRManagementNav from '@/components/hr/HRManagementNav';
import SettingsNav from '@/components/settings/SettingsNav';
import FleetManagementSidebar from '@/components/fleet/FleetManagementSidebar';

export default function SideNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine which side nav to show based on pathname
  const getSideNav = () => {
    // Load Management pages - handled by header navigation
    if (pathname.startsWith('/dashboard/loads') || 
        pathname.startsWith('/dashboard/loadboard') ||
        pathname.startsWith('/dashboard/dispatch') ||
        pathname.startsWith('/dashboard/calendar') ||
        pathname.startsWith('/dashboard/map')) {
      return null;
    }

    // Accounting pages - handled by header navigation
    if (pathname.startsWith('/dashboard/invoices') ||
        pathname.startsWith('/dashboard/settlements') ||
        pathname.startsWith('/dashboard/salary') ||
        pathname.startsWith('/dashboard/customers') ||
        pathname.startsWith('/dashboard/vendors') ||
        pathname.startsWith('/dashboard/locations') ||
        pathname.startsWith('/dashboard/analytics') ||
        pathname.startsWith('/dashboard/automation') ||
        pathname.startsWith('/dashboard/accounting') ||
        pathname.startsWith('/dashboard/batches')) {
      return null;
    }

    // Safety pages - handled by header navigation
    if (pathname.startsWith('/dashboard/safety')) {
      return null;
    }
    
    // Documents page (if not in safety section)
    if (pathname.startsWith('/dashboard/documents')) {
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

    // Fleet Department pages - handled by header navigation
    if (pathname.startsWith('/dashboard/fleet') ||
        pathname.startsWith('/dashboard/trucks') ||
        pathname.startsWith('/dashboard/trailers') ||
        pathname.startsWith('/dashboard/fleet-board')) {
      return null;
    }

    // HR Management pages - handled by header navigation
    if (pathname.startsWith('/dashboard/hr') ||
        pathname.startsWith('/dashboard/drivers')) {
      return null;
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
      <div className="shrink-0">
        {sideNav}
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
