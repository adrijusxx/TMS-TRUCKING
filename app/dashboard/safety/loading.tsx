import { LoadingState } from '@/components/ui/loading-state';

export default function SafetyLoading() {
  return <LoadingState message="Loading safety..." className="py-12" />;
}
