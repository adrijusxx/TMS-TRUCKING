import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function SafetyReportsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Reports' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Safety Reports</h1>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground">
            Safety reporting coming soon. This feature will allow you to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Generate compliance reports</li>
            <li>View safety metrics and trends</li>
            <li>Export reports in various formats</li>
            <li>Schedule automated report generation</li>
          </ul>
        </div>
      </div>
    </>
  );
}



