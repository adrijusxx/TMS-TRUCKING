import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SafetyPoliciesPage() {
  return (
    <DashboardLayout hideMainNav={true}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Safety Policies</h1>
          <p className="text-muted-foreground mt-2">
            Manage safety policies and procedures
          </p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground">
            Safety policy management coming soon. This feature will allow you to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>View and manage safety policies</li>
            <li>Track policy versions and updates</li>
            <li>Manage policy acknowledgments</li>
            <li>Upload policy documents</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

