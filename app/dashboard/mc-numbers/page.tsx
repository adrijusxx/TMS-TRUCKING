import { Breadcrumb } from '@/components/ui/breadcrumb';
import McNumberManager from '@/components/mc-numbers/McNumberManager';

export default function McNumbersPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'MC Numbers', href: '/dashboard/mc-numbers' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">MC Numbers</h1>
        </div>
        <McNumberManager />
      </div>
    </>
  );
}
