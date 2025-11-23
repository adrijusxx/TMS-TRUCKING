import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function InsuranceClaimsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Insurance', href: '/dashboard/safety/insurance' },
        { label: 'Claims' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Insurance Claims</h1>
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
    </>
  );
}



