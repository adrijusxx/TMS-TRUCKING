'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency, apiUrl } from '@/lib/utils';
import { LoadStatus } from '@prisma/client';

interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  pickupDate: string;
  revenue: number;
  customer: {
    name: string;
  };
}

const statusColors: Record<LoadStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_PICKUP: 'bg-orange-100 text-orange-800 border-orange-200',
  LOADED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  AT_DELIVERY: 'bg-pink-100 text-pink-800 border-pink-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  BILLING_HOLD: 'bg-amber-100 text-amber-800 border-amber-200',
  READY_TO_BILL: 'bg-lime-100 text-lime-800 border-lime-200',
  INVOICED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PAID: 'bg-teal-100 text-teal-800 border-teal-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchRecentLoads() {
  const response = await fetch(apiUrl('/api/loads?page=1&limit=5&status=all'));
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

export default function RecentLoads() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-loads'],
    queryFn: fetchRecentLoads,
  });

  const loads: Load[] = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Loads
            </CardTitle>
            <CardDescription>Latest load activity</CardDescription>
          </div>
          <Link href="/dashboard/loads">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading loads...
          </div>
        ) : loads.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No loads found
          </div>
        ) : (
          <div className="space-y-3">
            {loads.map((load) => (
              <Link
                key={load.id}
                href={`/dashboard/loads/${load.id}`}
                className="block p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{load.loadNumber}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[load.status]}`}
                      >
                        {formatStatus(load.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {load.customer.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{load.pickupCity}, {load.pickupState}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{load.deliveryCity}, {load.deliveryState}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pickup: {formatDate(load.pickupDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(load.revenue)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

