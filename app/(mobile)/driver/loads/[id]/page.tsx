import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DriverLoadDetail from '@/components/mobile/DriverLoadDetail';

export default async function DriverLoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Await params as it's now a Promise in Next.js 15+
  const resolvedParams = await params;

  const driver = await prisma.driver.findFirst({
    where: {
      userId: session.user.id,
      deletedAt: null,
      isActive: true,
    },
  });

  if (!driver) {
    redirect('/dashboard');
  }

  return <DriverLoadDetail loadId={resolvedParams.id} />;
}

