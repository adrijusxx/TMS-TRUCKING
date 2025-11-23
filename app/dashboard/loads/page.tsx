import { Breadcrumb } from '@/components/ui/breadcrumb';
import LoadList from '@/components/loads/LoadList';

export default function LoadsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Load Management', href: '/dashboard/loads' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Load Management</h1>
        </div>
        <LoadList />
      </div>
    </>
  );
}

