import CustomerListNew from '@/components/customers/CustomerListNew';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function CustomersPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Customers', href: '/dashboard/customers' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
        </div>
        <CustomerListNew />
      </div>
    </>
  );
}

