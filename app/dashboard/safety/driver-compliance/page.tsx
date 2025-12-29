import { Breadcrumb } from '@/components/ui/breadcrumb';
import DriverComplianceTable from '@/components/safety/compliance/DriverComplianceTable';

export default function DriverCompliancePage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Driver Compliance' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Manage all driver compliance records in one place - DQF, Medical Cards, CDL, MVR, Drug Tests, HOS, and Annual Reviews
          </p>
        </div>
        <DriverComplianceTable />
      </div>
    </>
  );
}

