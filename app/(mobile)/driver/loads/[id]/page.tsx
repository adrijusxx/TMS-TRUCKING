import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DriverLoadDetail from '@/components/mobile/DriverLoadDetail';

export default async function DriverLoadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const driver = await prisma.driver.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!driver) {
    redirect('/dashboard');
  }

  return <DriverLoadDetail loadId={params.id} />;
}

