import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SideNavWrapper from '@/components/layout/SideNavWrapper';

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

  return (
    <DashboardLayout>
      <SideNavWrapper>{children}</SideNavWrapper>
    </DashboardLayout>
  );
}

