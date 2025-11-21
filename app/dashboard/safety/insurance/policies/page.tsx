import DashboardLayout from '@/components/layout/DashboardLayout';

export default function InsurancePoliciesPage() {
  return (
    <DashboardLayout hideMainNav={true}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Insurance Policies</h1>
          <p className="text-muted-foreground mt-2">
            Manage insurance policies and coverage
          </p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground">
            Insurance policy management coming soon. This feature will allow you to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>View active insurance policies</li>
            <li>Track policy expiration dates</li>
            <li>Manage coverage details</li>
            <li>Upload policy documents</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

