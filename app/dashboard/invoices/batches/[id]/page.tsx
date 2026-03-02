import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import BatchDetail from '@/components/batches/BatchDetail';
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
    <BatchDetail batchId={id} />
  );
}
