import CreateBreakdownForm from '@/components/breakdowns/CreateBreakdownForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewBreakdownPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Breakdowns', href: '/dashboard/breakdowns' },
        { label: 'New Breakdown' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Report New Breakdown</h1>
        </div>
        <CreateBreakdownForm />
      </div>
    </>
  );
}

