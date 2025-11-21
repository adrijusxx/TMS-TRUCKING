'use client';

import { usePathname } from 'next/navigation';
import FleetManagementSidebar from '@/components/fleet/FleetManagementSidebar';

export default function FleetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Show Fleet sidebar for all fleet-related routes
  const isFleetSection = 
    pathname?.startsWith('/dashboard/fleet') ||
    pathname?.startsWith('/dashboard/trucks') ||
    pathname?.startsWith('/dashboard/trailers') ||
    pathname?.startsWith('/dashboard/maintenance') ||
    pathname?.startsWith('/dashboard/inspections') ||
    pathname === '/dashboard/fleet-board';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] relative -mx-3 lg:-mx-4">
      {/* Fleet Department Sidebar */}
      {isFleetSection && (
        <aside className="hidden lg:block w-64 border-l border-r bg-background overflow-y-auto sticky top-0 h-[calc(100vh-4rem)] flex-shrink-0 ml-2">
          <FleetManagementSidebar />
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background max-w-full">
        <div className="container mx-auto max-w-7xl px-3 lg:px-4">
          {children}
        </div>
      </main>
    </div>
  );
}

