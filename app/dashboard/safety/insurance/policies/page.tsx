import InsurancePoliciesTable from '@/components/safety/insurance/InsurancePoliciesTable';

export default function InsurancePoliciesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Insurance Policies</h2>
        <p className="text-muted-foreground">Manage insurance policies, coverage limits, and renewal tracking</p>
      </div>
      <InsurancePoliciesTable />
    </div>
  );
}
