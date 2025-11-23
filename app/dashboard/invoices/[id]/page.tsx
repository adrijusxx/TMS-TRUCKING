import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import InvoiceDetail from '@/components/invoices/InvoiceDetail';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      customer: {
        companyId: session.user.companyId,
      },
    },
    include: {
      customer: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  // Fetch loads separately using loadIds
  const loads = invoice.loadIds && invoice.loadIds.length > 0
    ? await prisma.load.findMany({
        where: {
          id: { in: invoice.loadIds },
          companyId: session.user.companyId,
        },
        select: {
          id: true,
          loadNumber: true,
          pickupCity: true,
          pickupState: true,
          deliveryCity: true,
          deliveryState: true,
          revenue: true,
        },
      })
    : [];

  return (
    <>
      <Breadcrumb items={[
        { label: 'Invoices', href: '/dashboard/invoices' },
        { label: `Invoice #${invoice.invoiceNumber}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Details</h1>
        </div>
        <InvoiceDetail invoice={{ ...invoice, loads }} />
      </div>
    </>
  );
}

