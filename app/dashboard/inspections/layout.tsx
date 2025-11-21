'use client';

import FleetManagementSidebar from '@/components/fleet/FleetManagementSidebar';

export default function InspectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] relative -mx-3 lg:-mx-4">
      {/* Fleet Department Sidebar */}
      <aside className="hidden lg:block w-64 border-l border-r bg-background overflow-y-auto sticky top-0 h-[calc(100vh-4rem)] flex-shrink-0 ml-2">
        <FleetManagementSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background max-w-full">
        <div className="container mx-auto max-w-7xl px-3 lg:px-4">
          {children}
        </div>
      </main>
    </div>
  );
}

