import PoliciesTable from '@/components/safety/policies/PoliciesTable';

export default function SafetyPoliciesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Safety Policies</h2>
        <p className="text-muted-foreground">Create, manage, and distribute safety policies to drivers</p>
      </div>
      <PoliciesTable />
    </div>
  );
}
