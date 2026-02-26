import AuditPrepDashboard from '@/components/safety/audit/AuditPrepDashboard';

export default function AuditPrepPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">DOT Audit Prep</h2>
        <p className="text-muted-foreground">
          Review driver qualification files and prepare for DOT audits
        </p>
      </div>
      <AuditPrepDashboard />
    </div>
  );
}
