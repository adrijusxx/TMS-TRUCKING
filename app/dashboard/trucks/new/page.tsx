import CreateTruckForm from '@/components/trucks/CreateTruckForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewTruckPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Trucks', href: '/dashboard/trucks' },
        { label: 'New Truck' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add New Truck</h1>
        </div>
        <CreateTruckForm />
      </div>
    </>
  );
}

