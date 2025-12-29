import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import SettlementDetail from '@/components/settlements/SettlementDetail';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function SettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  // Await params as it's now a Promise in Next.js 15+
  const resolvedParams = await params;

  // Verify settlement exists and belongs to company (through driver)
  const settlement = await prisma.settlement.findFirst({
    where: {
      id: resolvedParams.id,
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
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settlements', href: '/dashboard/settlements' },
        { label: `Settlement #${resolvedParams.id.slice(0, 8)}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settlement Details</h1>
        </div>
        <SettlementDetail settlementId={resolvedParams.id} />
      </div>
    </>
  );
}

