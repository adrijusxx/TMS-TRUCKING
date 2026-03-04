import { LoadingState } from '@/components/ui/loading-state';

export default function CompanyExpensesLoading() {
  return <LoadingState message="Loading expenses..." className="py-12" />;
}
