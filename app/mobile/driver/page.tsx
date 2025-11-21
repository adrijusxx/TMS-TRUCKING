import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DriverMobileDashboard from '@/components/mobile/DriverMobileDashboard';

export default async function DriverMobilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
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

  // Convert null to undefined for currentTruck to match component type
  const driverWithUndefinedTruck = {
    ...driver,
    currentTruck: driver.currentTruck ? {
      id: driver.currentTruck.id,
      truckNumber: driver.currentTruck.truckNumber,
    } : undefined,
  };

  return <DriverMobileDashboard driver={driverWithUndefinedTruck} />;
}

