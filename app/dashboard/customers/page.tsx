import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CustomersTableClient } from './CustomersTableClient';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const customers = await prisma.customer.findMany({
    where: {
      companyId: session.user.companyId,
      deletedAt: null,
    },
    orderBy: {
      customerNumber: 'asc',
    },
  });

  // Transform data to match the expected format
  const data = customers.map((customer) => ({
    id: customer.id,
    customerNumber: customer.customerNumber,
    name: customer.name,
    type: customer.type,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
    phone: customer.phone,
    email: customer.email,
    warning: customer.warning,
    createdAt: customer.createdAt,
  }));

  return (
    <>
      <Breadcrumb items={[{ label: 'Customers', href: '/dashboard/customers' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
        </div>
        <CustomersTableClient data={data} />
      </div>
    </>
  );
}

