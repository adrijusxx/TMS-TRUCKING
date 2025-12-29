import { Breadcrumb } from '@/components/ui/breadcrumb';
import EDITesting from '@/components/edi/EDITesting';

export default function EDITestingPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'EDI', href: '/dashboard/edi' },
        { label: 'Testing' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">EDI Testing</h1>
        </div>
        <EDITesting />
      </div>
    </>
  );
}

