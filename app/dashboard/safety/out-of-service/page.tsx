import DashboardLayout from '@/components/layout/DashboardLayout';

export default function OutOfServicePage() {
  return (
    <DashboardLayout hideMainNav={true}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Out of Service Orders</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage out-of-service orders for vehicles and drivers
          </p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground">
            Out-of-service order management coming soon. This feature will allow you to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>View active out-of-service orders</li>
            <li>Track OOS violations and resolutions</li>
            <li>Monitor compliance status</li>
            <li>Generate OOS reports</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

