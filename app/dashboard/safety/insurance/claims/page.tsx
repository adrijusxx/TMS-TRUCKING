import DashboardLayout from '@/components/layout/DashboardLayout';

export default function InsuranceClaimsPage() {
  return (
    <DashboardLayout hideMainNav={true}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Insurance Claims</h1>
          <p className="text-muted-foreground mt-2">
            Manage insurance claims and track claim status
          </p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground">
            Insurance claims management coming soon. This feature will allow you to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Submit and track insurance claims</li>
            <li>View claim history and status</li>
            <li>Upload supporting documents</li>
            <li>Monitor claim processing</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

