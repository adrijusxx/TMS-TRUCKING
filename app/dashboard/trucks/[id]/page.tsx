import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import TruckDetail from '@/components/trucks/TruckDetail';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function TruckDetailPage({
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

  const truck = await prisma.truck.findFirst({
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
      documents: {
        where: { deletedAt: null },
      },
    },
  });

  if (!truck) {
    notFound();
  }

  return (
    <>
      <Breadcrumb items={[
        { label: 'Trucks', href: '/dashboard/trucks' },
        { label: `Truck #${truck.truckNumber}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Truck Details</h1>
        </div>
        <TruckDetail truck={truck} />
      </div>
    </>
  );
}

