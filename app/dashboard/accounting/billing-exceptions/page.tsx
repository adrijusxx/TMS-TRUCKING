import { Breadcrumb } from '@/components/ui/breadcrumb';
import { BillingExceptionsQueue } from '@/components/accounting/BillingExceptionsQueue';

export default function BillingExceptionsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Accounting', href: '/dashboard/accounting' },
          { label: 'Billing Exceptions Queue' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing Exceptions Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and resolve loads with billing holds or ready for invoicing
          </p>
        </div>
        <BillingExceptionsQueue />
      </div>
    </>
  );
}

