'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Clock, DollarSign, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import Link from 'next/link';

interface Load {
  id: string;
  loadNumber: string;
  status: string;
  customer: {
    name: string;
  };
  pickup?: {
    city: string;
    state: string;
    date: Date | string;
  };
  delivery?: {
    city: string;
    state: string;
    date: Date | string;
  };
  pickupCity?: string;
  pickupState?: string;
  pickupDate?: Date | string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryDate?: Date | string;
  revenue: number;
}

async function fetchDriverLoads() {
  const response = await fetch(apiUrl('/api/mobile/loads'));
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

export default function DriverLoadList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['driver-loads'],
    queryFn: fetchDriverLoads,
  });

  const loads: Load[] = data?.data?.loads || data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 dark:border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/mobile/driver">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">All Loads</h1>
            <p className="text-sm text-muted-foreground">
              {loads.length} total load(s)
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading loads...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading loads
          </div>
        ) : loads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No loads found</p>
              <p className="text-muted-foreground">
                You don't have any assigned loads yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          loads.map((load) => (
            <Link key={load.id} href={`/mobile/loads/${load.id}`}>
              <Card className="hover:bg-muted transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Load #{load.loadNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {load.customer.name}
                      </p>
                    </div>
                    <Badge variant="outline">{load.status}</Badge>
                  </div>
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {load.pickup?.city || load.pickupCity}, {load.pickup?.state || load.pickupState}
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{formatDate(load.pickup?.date || load.pickupDate!)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {load.delivery?.city || load.deliveryCity}, {load.delivery?.state || load.deliveryState}
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{formatDate(load.delivery?.date || load.deliveryDate!)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {formatCurrency(load.revenue)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

