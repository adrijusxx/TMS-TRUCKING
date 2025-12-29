import { Breadcrumb } from '@/components/ui/breadcrumb';
import { TrailersTableClient } from './TrailersTableClient';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function TrailersPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const trailers = await prisma.trailer.findMany({
    where: {
      companyId: session.user.companyId,
      deletedAt: null,
    },
    include: {
      mcNumber: {
        select: {
          id: true,
          number: true,
        },
      },
      assignedTruck: {
        select: {
          id: true,
          truckNumber: true,
        },
      },
    },
    orderBy: {
      trailerNumber: 'asc',
    },
  });

  // Transform data to match the expected format
  const data = trailers.map((trailer) => ({
    id: trailer.id,
    trailerNumber: trailer.trailerNumber,
    vin: trailer.vin,
    make: trailer.make,
    model: trailer.model,
    year: trailer.year,
    licensePlate: trailer.licensePlate,
    state: trailer.state,
    type: trailer.type,
    status: trailer.status,
    fleetStatus: trailer.fleetStatus,
    mcNumberId: trailer.mcNumberId,
    mcNumber: trailer.mcNumber,
    assignedTruckId: trailer.assignedTruckId,
    assignedTruck: trailer.assignedTruck,
    createdAt: trailer.createdAt,
    notes: null, // Trailers don't have a notes field in schema
  }));

  return (
    <>
      <Breadcrumb items={[{ label: 'Trailers', href: '/dashboard/trailers' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trailers</h1>
        </div>
        <TrailersTableClient data={data} />
      </div>
    </>
  );
}
