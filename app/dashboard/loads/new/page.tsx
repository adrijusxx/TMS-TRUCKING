import CreateLoadForm from '@/components/loads/CreateLoadForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewLoadPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Load Management', href: '/dashboard/loads' },
        { label: 'New Load' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Load</h1>
        </div>
        <CreateLoadForm />
      </div>
    </>
  );
}

