import { Breadcrumb } from '@/components/ui/breadcrumb';
import { TrucksTableClient } from './TrucksTableClient';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function TrucksPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const trucks = await prisma.truck.findMany({
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
    },
    orderBy: {
      truckNumber: 'asc',
    },
  });

  // Transform data to match the expected format
  const data = trucks.map((truck) => ({
    id: truck.id,
    truckNumber: truck.truckNumber,
    vin: truck.vin || '',
    make: truck.make,
    model: truck.model,
    year: truck.year,
    licensePlate: truck.licensePlate || '',
    state: truck.state || '',
    equipmentType: truck.equipmentType || 'DRY_VAN',
    status: truck.status,
    mcNumberId: truck.mcNumberId,
    mcNumber: truck.mcNumber,
    createdAt: truck.createdAt,
    notes: null, // Trucks don't have a notes field in schema
  }));

  return (
    <>
      <Breadcrumb items={[{ label: 'Trucks', href: '/dashboard/trucks' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trucks</h1>
        </div>
        <TrucksTableClient data={data} />
      </div>
    </>
  );
}

