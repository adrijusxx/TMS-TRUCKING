import DashboardLayout from '@/components/layout/DashboardLayout';
import SettlementList from '@/components/settlements/SettlementList';

export default function SalaryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Salary</h1>
          <p className="text-muted-foreground">Manage driver salaries and payments</p>
        </div>
        <SettlementList />
      </div>
    </DashboardLayout>
  );
}
