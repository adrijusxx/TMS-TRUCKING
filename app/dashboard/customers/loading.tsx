import { LoadingState } from '@/components/ui/loading-state';

export default function CustomersLoading() {
  return <LoadingState message="Loading customers..." className="py-12" />;
}
