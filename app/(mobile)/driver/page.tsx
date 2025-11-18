import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DriverMobileDashboard from '@/components/mobile/DriverMobileDashboard';

export default async function DriverMobilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const driver = await prisma.driver.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
      currentTruck: true,
    },
  });

  if (!driver) {
    redirect('/dashboard');
  }

  return <DriverMobileDashboard driver={driver} />;
}

