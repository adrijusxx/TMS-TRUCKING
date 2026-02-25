import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import CustomerDetail from '@/components/customers/CustomerDetail';
export default async function CustomerDetailPage({
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

  const customer = await prisma.customer.findFirst({
    where: {
      id: resolvedParams.id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
    include: {
      loads: {
        where: { deletedAt: null },
        select: {
          id: true,
          loadNumber: true,
          status: true,
          pickupCity: true,
          pickupState: true,
          deliveryCity: true,
          deliveryState: true,
          revenue: true,
          pickupDate: true,
          deliveryDate: true,
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
      contacts: {
        orderBy: { isPrimary: 'desc' },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <CustomerDetail customer={customer} />
  );
}

