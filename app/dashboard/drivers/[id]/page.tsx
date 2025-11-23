import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import DriverDetail from '@/components/drivers/DriverDetail';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const driver = await prisma.driver.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },
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

  if (!driver) {
    notFound();
  }

  return (
    <>
      <Breadcrumb items={[
        { label: 'Drivers', href: '/dashboard/drivers' },
        { label: `${driver.user.firstName} ${driver.user.lastName}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Details</h1>
        </div>
        <DriverDetail driver={driver} />
      </div>
    </>
  );
}

