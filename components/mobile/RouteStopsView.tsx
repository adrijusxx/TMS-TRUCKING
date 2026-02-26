'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, CheckCircle, Circle, Truck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import NavigationButtons from './NavigationButtons';

interface Stop {
  type: 'pickup' | 'delivery';
  city: string;
  state: string;
  address?: string;
  date?: Date | string;
  contact?: string;
  phone?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface RouteStopsViewProps {
  pickup: {
    city: string;
    state: string;
    address?: string;
    date?: Date | string;
    contact?: string;
    phone?: string;
  };
  delivery: {
    city: string;
    state: string;
    address?: string;
    date?: Date | string;
    contact?: string;
    phone?: string;
  };
  currentStatus: string;
  totalMiles?: number;
}

function getStopStates(status: string): { pickupDone: boolean; pickupCurrent: boolean; deliveryCurrent: boolean } {
  const pickupDoneStatuses = ['LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED'];
  const pickupCurrentStatuses = ['EN_ROUTE_PICKUP', 'AT_PICKUP'];
  const deliveryCurrentStatuses = ['EN_ROUTE_DELIVERY', 'AT_DELIVERY'];

  return {
    pickupDone: pickupDoneStatuses.includes(status),
    pickupCurrent: pickupCurrentStatuses.includes(status),
    deliveryCurrent: deliveryCurrentStatuses.includes(status),
  };
}

export default function RouteStopsView({
  pickup,
  delivery,
  currentStatus,
  totalMiles,
}: RouteStopsViewProps) {
  const { pickupDone, pickupCurrent, deliveryCurrent } = getStopStates(currentStatus);
  const deliveryDone = currentStatus === 'DELIVERED';

  const stops: Stop[] = [
    {
      type: 'pickup',
      ...pickup,
      isCompleted: pickupDone,
      isCurrent: pickupCurrent,
    },
    {
      type: 'delivery',
      ...delivery,
      isCompleted: deliveryDone,
      isCurrent: deliveryCurrent,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Route
          </span>
          {totalMiles && (
            <Badge variant="secondary" className="text-xs">
              {totalMiles.toLocaleString()} mi
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {stops.map((stop, index) => (
            <div key={stop.type} className="flex gap-3 relative">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                {stop.isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                ) : stop.isCurrent ? (
                  <Truck className="h-6 w-6 text-blue-500 shrink-0 animate-pulse" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground shrink-0" />
                )}
                {index < stops.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[40px] my-1 ${
                    stop.isCompleted ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>

              {/* Stop Info */}
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {stop.type}
                  </span>
                  {stop.isCurrent && (
                    <Badge variant="default" className="text-xs">Current</Badge>
                  )}
                  {stop.isCompleted && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Done
                    </Badge>
                  )}
                </div>
                <p className="font-semibold">
                  {stop.city}, {stop.state}
                </p>
                {stop.address && (
                  <p className="text-sm text-muted-foreground">{stop.address}</p>
                )}
                {stop.date && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(stop.date)}
                  </div>
                )}
                {stop.contact && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {stop.contact} {stop.phone && `(${stop.phone})`}
                  </p>
                )}

                {/* Navigation buttons for current/upcoming stops */}
                {!stop.isCompleted && (
                  <div className="mt-2">
                    <NavigationButtons
                      address={stop.address || ''}
                      city={stop.city}
                      state={stop.state}
                      label={`Navigate to ${stop.type}`}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
