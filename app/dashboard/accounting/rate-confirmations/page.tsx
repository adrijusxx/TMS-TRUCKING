import { auth } from '@/app/api/auth/[...nextauth]/route';
import RateConfirmationListNew from '@/components/rate-confirmations/RateConfirmationListNew';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function RateConfirmationsPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Accounting', href: '/dashboard/accounting' },
          {
            label: 'Rate Confirmations',
            href: '/dashboard/accounting/rate-confirmations',
          },
        ]}
      />
      <RateConfirmationListNew />
    </div>
  );
}

