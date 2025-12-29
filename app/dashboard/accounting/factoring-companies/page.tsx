import { auth } from '@/app/api/auth/[...nextauth]/route';
import FactoringCompanyListNew from '@/components/factoring/FactoringCompanyListNew';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function FactoringCompaniesPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Accounting', href: '/dashboard/accounting' },
          { label: 'Factoring', href: '/dashboard/accounting/factoring' },
          { label: 'Factoring Companies' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Factoring Companies</h1>
        </div>
        <FactoringCompanyListNew />
      </div>
    </>
  );
}

