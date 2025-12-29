import { Breadcrumb } from '@/components/ui/breadcrumb';
import CSAScoreDashboard from '@/components/safety/compliance/CSAScoreDashboard';

export default function CSAScoresPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Compliance', href: '/dashboard/safety/compliance' },
        { label: 'CSA Scores' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CSA Scores</h1>
        </div>
        <CSAScoreDashboard />
      </div>
    </>
  );
}

