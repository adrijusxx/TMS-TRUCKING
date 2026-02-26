import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SettlementDetailMobile from '@/components/mobile/SettlementDetailMobile';

export default async function SettlementDetailPage({
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

  const resolvedParams = await params;

  return <SettlementDetailMobile settlementId={resolvedParams.id} />;
}
