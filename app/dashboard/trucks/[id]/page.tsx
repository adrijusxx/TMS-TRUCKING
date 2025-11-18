import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import TruckDetail from '@/components/trucks/TruckDetail';

export default async function TruckDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const truck = await prisma.truck.findFirst({
    where: {
      id: params.id,
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
      documents: {
        where: { deletedAt: null },
      },
    },
  });

  if (!truck) {
    notFound();
  }

  return <TruckDetail truck={truck} />;
}

