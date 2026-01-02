import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SideNavWrapper from '@/components/layout/SideNavWrapper';
import DepartmentRouteGuard from '@/components/auth/DepartmentRouteGuard';
import { prisma } from '@/lib/prisma';

// Mark this layout as dynamic since it uses auth() which internally uses headers()
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    // Next.js redirect() automatically prepends basePath from next.config.js
    redirect('/login');
  }

  // Check if user is a driver - drivers should only access mobile app
  if (session.user.role === 'DRIVER') {
    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (driver) {
      // Driver is trying to access dashboard - redirect to mobile app
      redirect('/mobile/driver');
    }
  }

  return (
    <DashboardLayout session={session}>
      <DepartmentRouteGuard>
        <SideNavWrapper>{children}</SideNavWrapper>
      </DepartmentRouteGuard>
    </DashboardLayout>
  );
}

