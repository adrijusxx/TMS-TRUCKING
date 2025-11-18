import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateBreakdownForm from '@/components/breakdowns/CreateBreakdownForm';

export default function NewBreakdownPage() {
  return (
    <DashboardLayout>
      <CreateBreakdownForm />
    </DashboardLayout>
  );
}

