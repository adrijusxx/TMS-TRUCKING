import { Breadcrumb } from '@/components/ui/breadcrumb';
import EDIGenerator from '@/components/edi/EDIGenerator';

export default function EDIPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'EDI', href: '/dashboard/edi' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">EDI</h1>
        </div>
        <EDIGenerator />
      </div>
    </>
  );
}

