'use client';

import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import {
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  AlertCircle,
} from 'lucide-react';

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string | null;
  location?: string | null;
  createdBy: string;
  createdAt: string | Date;
}

interface LoadActivityTabProps {
  load: {
    statusHistory?: StatusHistoryItem[];
    documents?: Array<{ id: string; title: string; createdAt: string | Date }>;
  };
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock,
  ASSIGNED: Truck,
  EN_ROUTE_PICKUP: MapPin,
  AT_PICKUP: MapPin,
  LOADED: Truck,
  EN_ROUTE_DELIVERY: Truck,
  AT_DELIVERY: MapPin,
  DELIVERED: CheckCircle2,
  BILLING_HOLD: AlertCircle,
  READY_TO_BILL: FileText,
  INVOICED: FileText,
  PAID: CheckCircle2,
  CANCELLED: AlertCircle,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-700 border-blue-200',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-700 border-purple-200',
  AT_PICKUP: 'bg-orange-100 text-orange-700 border-orange-200',
  LOADED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  AT_DELIVERY: 'bg-pink-100 text-pink-700 border-pink-200',
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  BILLING_HOLD: 'bg-amber-100 text-amber-700 border-amber-200',
  READY_TO_BILL: 'bg-lime-100 text-lime-700 border-lime-200',
  INVOICED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PAID: 'bg-teal-100 text-teal-700 border-teal-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function LoadActivityTab({ load }: LoadActivityTabProps) {
  const history = load.statusHistory ?? [];

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No activity recorded yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Status changes will appear here as the load progresses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 pb-4">
      <p className="text-xs text-muted-foreground mb-4">
        {history.length} event{history.length !== 1 ? 's' : ''} recorded
      </p>
      <ol className="relative border-l border-border ml-3">
        {history.map((item, idx) => {
          const Icon = STATUS_ICONS[item.status] ?? Clock;
          const colorClass = STATUS_COLORS[item.status] ?? 'bg-muted text-muted-foreground border-border';
          const isLatest = idx === 0;

          return (
            <li key={item.id} className="mb-6 ml-6">
              {/* Timeline dot */}
              <span
                className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                  isLatest ? 'ring-2 ring-primary ring-offset-1' : ''
                } ${colorClass}`}
              >
                <Icon className="h-3 w-3" />
              </span>

              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <Badge className={`text-xs ${colorClass}`}>
                    {formatStatus(item.status)}
                  </Badge>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(item.createdAt)}
                  </time>
                </div>

                {item.notes && (
                  <p className="mt-1.5 text-sm text-foreground">{item.notes}</p>
                )}

                {item.location && (
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {item.location}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
