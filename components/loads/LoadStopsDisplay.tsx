'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface StopItem {
  orderId?: string;
  item?: string;
  product?: string;
  pieces?: number;
  weight?: number;
  description?: string;
}

interface LoadStop {
  stopType: 'PICKUP' | 'DELIVERY';
  sequence: number;
  company?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  earliestArrival?: string;
  latestArrival?: string;
  contactName?: string;
  contactPhone?: string;
  items?: StopItem[];
  totalPieces?: number;
  totalWeight?: number;
  notes?: string;
  specialInstructions?: string;
}

interface LoadStopsDisplayProps {
  stops: LoadStop[];
}

export default function LoadStopsDisplay({ stops }: LoadStopsDisplayProps) {
  if (!stops || stops.length === 0) {
    return null;
  }

  const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
  const pickups = sortedStops.filter(s => s.stopType === 'PICKUP');
  const deliveries = sortedStops.filter(s => s.stopType === 'DELIVERY');

  return (
    <div className="space-y-6">
      {/* Pickup Stops */}
      {pickups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pickup Stops ({pickups.length})</CardTitle>
            <CardDescription>Origin locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pickups.map((stop, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      Stop {stop.sequence}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold">{stop.company || stop.address}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {stop.address}, {stop.city}, {stop.state} {stop.zip}
                        </span>
                      </div>
                      {stop.phone && (
                        <p className="text-sm text-muted-foreground mt-1">Phone: {stop.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {(stop.earliestArrival || stop.latestArrival) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {stop.earliestArrival && formatDateTime(stop.earliestArrival)}
                      {stop.earliestArrival && stop.latestArrival && ' - '}
                      {stop.latestArrival && formatDateTime(stop.latestArrival)}
                    </span>
                  </div>
                )}

                {(stop.totalPieces || stop.totalWeight) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    <span>
                      {stop.totalPieces && `${stop.totalPieces} pieces`}
                      {stop.totalPieces && stop.totalWeight && ' • '}
                      {stop.totalWeight && `${stop.totalWeight} lbs`}
                    </span>
                  </div>
                )}

                {stop.items && stop.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Items:</p>
                    <div className="space-y-1">
                      {stop.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="text-xs text-muted-foreground">
                          {item.orderId && <span className="font-medium">{item.orderId}</span>}
                          {item.product && <span> • {item.product}</span>}
                          {item.pieces && <span> • {item.pieces} pcs</span>}
                          {item.weight && <span> • {item.weight} lbs</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stop.specialInstructions && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Special Instructions:</p>
                    <p className="text-xs text-muted-foreground">{stop.specialInstructions}</p>
                  </div>
                )}

                {stop.notes && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Notes:</p>
                    <p className="text-xs text-muted-foreground">{stop.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delivery Stops */}
      {deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Stops ({deliveries.length})</CardTitle>
            <CardDescription>Destination locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveries.map((stop, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      Stop {stop.sequence}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold">{stop.company || stop.address}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {stop.address}, {stop.city}, {stop.state} {stop.zip}
                        </span>
                      </div>
                      {stop.phone && (
                        <p className="text-sm text-muted-foreground mt-1">Phone: {stop.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {(stop.earliestArrival || stop.latestArrival) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {stop.earliestArrival && formatDateTime(stop.earliestArrival)}
                      {stop.earliestArrival && stop.latestArrival && ' - '}
                      {stop.latestArrival && formatDateTime(stop.latestArrival)}
                    </span>
                  </div>
                )}

                {(stop.totalPieces || stop.totalWeight) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    <span>
                      {stop.totalPieces && `${stop.totalPieces} pieces`}
                      {stop.totalPieces && stop.totalWeight && ' • '}
                      {stop.totalWeight && `${stop.totalWeight} lbs`}
                    </span>
                  </div>
                )}

                {stop.items && stop.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Items:</p>
                    <div className="space-y-1">
                      {stop.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="text-xs text-muted-foreground">
                          {item.orderId && <span className="font-medium">{item.orderId}</span>}
                          {item.product && <span> • {item.product}</span>}
                          {item.pieces && <span> • {item.pieces} pcs</span>}
                          {item.weight && <span> • {item.weight} lbs</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stop.specialInstructions && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Special Instructions:</p>
                    <p className="text-xs text-muted-foreground">{stop.specialInstructions}</p>
                  </div>
                )}

                {stop.notes && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Notes:</p>
                    <p className="text-xs text-muted-foreground">{stop.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

