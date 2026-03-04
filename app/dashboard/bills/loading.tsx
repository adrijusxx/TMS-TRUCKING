import { LoadingState } from '@/components/ui/loading-state';

export default function BillsLoading() {
  return <LoadingState message="Loading bills..." className="py-12" />;
}
