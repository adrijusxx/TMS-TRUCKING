import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DriverLoadList from '@/components/mobile/DriverLoadList';

export default async function DriverLoadsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const driver = await prisma.driver.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!driver) {
    redirect('/dashboard');
  }

  return <DriverLoadList />;
}

