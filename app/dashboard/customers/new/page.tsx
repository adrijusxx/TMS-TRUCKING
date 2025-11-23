import CreateCustomerForm from '@/components/customers/CreateCustomerForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewCustomerPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Customers', href: '/dashboard/customers' },
        { label: 'New Customer' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add New Customer</h1>
        </div>
        <CreateCustomerForm />
      </div>
    </>
  );
}

