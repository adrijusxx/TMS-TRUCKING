import ReportsDashboard from '@/components/safety/reports/ReportsDashboard';

export default function SafetyReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Safety Reports</h2>
        <p className="text-muted-foreground">View safety analytics, trends, and performance reports</p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
