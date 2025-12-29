import { auth } from '@/app/api/auth/[...nextauth]/route';
import AccessorialChargesList from '@/components/accessorial/AccessorialChargesList';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AccessorialChargesPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Accounting', href: '/dashboard/accounting' },
          { label: 'Accessorial Charges' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accessorial Charges</h1>
        </div>
        <AccessorialChargesList />
      </div>
    </>
  );
}

