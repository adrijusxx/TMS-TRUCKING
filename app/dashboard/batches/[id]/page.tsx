import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import BatchDetail from '@/components/batches/BatchDetail';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const { id } = await params;

  const batch = await prisma.invoiceBatch.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
    },
    select: {
      id: true,
      batchNumber: true,
    },
  });

  if (!batch) {
    notFound();
  }

  return (
    <>
      <Breadcrumb items={[
        { label: 'Batches', href: '/dashboard/batches' },
        { label: `Batch #${batch.batchNumber}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Batch Details</h1>
        </div>
        <BatchDetail batchId={id} />
      </div>
    </>
  );
}
