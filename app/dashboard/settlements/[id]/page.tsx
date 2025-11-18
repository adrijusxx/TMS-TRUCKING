import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import SettlementDetail from '@/components/settlements/SettlementDetail';

export default async function SettlementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  // Verify settlement exists and belongs to company (through driver)
  const settlement = await prisma.settlement.findFirst({
    where: {
      id: params.id,
      driver: {
        companyId: session.user.companyId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!settlement) {
    notFound();
  }

  // Component fetches its own data via React Query
  return <SettlementDetail settlementId={params.id} />;
}

