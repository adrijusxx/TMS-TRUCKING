import { Breadcrumb } from '@/components/ui/breadcrumb';
import { VendorsTableClient } from './VendorsTableClient';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function VendorsPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const vendors = await prisma.vendor.findMany({
    where: {
      companyId: session.user.companyId,
      deletedAt: null,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Transform data to match the expected format
  const data = vendors.map((vendor) => ({
    id: vendor.id,
    vendorNumber: vendor.vendorNumber,
    name: vendor.name,
    type: vendor.type,
    address: vendor.address,
    city: vendor.city,
    state: vendor.state,
    zip: vendor.zip,
    phone: vendor.phone,
    email: vendor.email,
    createdAt: vendor.createdAt,
    notes: null, // Vendors don't have a notes field in schema
  }));

  return (
    <>
      <Breadcrumb items={[{ label: 'Vendors', href: '/dashboard/vendors' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
        </div>
        <VendorsTableClient data={data} />
      </div>
    </>
  );
}
