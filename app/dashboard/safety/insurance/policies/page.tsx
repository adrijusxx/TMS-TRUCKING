import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function InsurancePoliciesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Insurance', href: '/dashboard/safety/insurance' },
        { label: 'Policies' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Insurance Policies</h1>
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
    </>
  );
}



