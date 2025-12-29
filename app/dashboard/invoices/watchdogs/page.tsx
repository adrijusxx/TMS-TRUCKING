import WatchdogList from '@/components/watchdogs/WatchdogList';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function WatchdogsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Invoices', href: '/dashboard/invoices' },
        { label: 'Watchdogs' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Watchdogs</h1>
        </div>
        <WatchdogList />
      </div>
    </>
  );
}

