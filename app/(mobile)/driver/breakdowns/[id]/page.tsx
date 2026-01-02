import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import BreakdownDetailMobile from '@/components/mobile/BreakdownDetailMobile';

export default async function BreakdownDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

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

  const { id } = await params;

  return <BreakdownDetailMobile breakdownId={id} />;
}

