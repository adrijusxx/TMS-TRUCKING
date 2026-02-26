import OOSTable from '@/components/safety/oos/OOSTable';

export default function OutOfServicePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Out of Service Orders</h2>
        <p className="text-muted-foreground">Track and manage driver and vehicle out-of-service orders</p>
      </div>
      <OOSTable />
    </div>
  );
}
