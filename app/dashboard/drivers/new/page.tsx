import CreateDriverForm from '@/components/drivers/CreateDriverForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewDriverPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Drivers', href: '/dashboard/drivers' },
        { label: 'New Driver' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add New Driver</h1>
        </div>
        <CreateDriverForm />
      </div>
    </>
  );
}

