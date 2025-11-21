import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SafetyReportsPage() {
  return (
    <DashboardLayout hideMainNav={true}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Safety Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate and view safety reports
          </p>
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
    </DashboardLayout>
  );
}

