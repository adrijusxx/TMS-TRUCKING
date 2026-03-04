import { LoadingState } from '@/components/ui/loading-state';

export default function InvoicesLoading() {
  return <LoadingState message="Loading invoices..." className="py-12" />;
}
