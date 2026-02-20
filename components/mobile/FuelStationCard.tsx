'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Star, Clock } from 'lucide-react';
import type { FuelStation } from '@/lib/services/fuel/FuelStationProvider';

interface FuelStationCardProps {
  station: FuelStation;
  averagePrice?: number;
  compact?: boolean;
}

export default function FuelStationCard({
  station,
  averagePrice,
  compact,
}: FuelStationCardProps) {
  const savings =
    averagePrice && station.dieselPrice
      ? averagePrice - station.dieselPrice
      : 0;

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={compact ? 'border-0 shadow-none' : ''}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm truncate">{station.name}</p>
              {station.brand && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                  {station.brand}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {station.address}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {station.distanceFromRoute != null && (
                <span className="text-xs text-muted-foreground">
                  {station.distanceFromRoute.toFixed(1)} mi away
                </span>
              )}
              {station.milesAlongRoute != null && station.distanceFromRoute == null && (
                <span className="text-xs text-muted-foreground">
                  {station.milesAlongRoute.toFixed(0)} mi along route
                </span>
              )}
              {station.rating && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {station.rating.toFixed(1)}
                </span>
              )}
              {station.isOpen != null && (
                <span
                  className={`text-xs ${station.isOpen ? 'text-green-600' : 'text-red-500'}`}
                >
                  {station.isOpen ? 'Open' : 'Closed'}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            {station.dieselPrice != null ? (
              <>
                <p className="text-lg font-bold text-green-600">
                  ${station.dieselPrice.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">per gal</p>
                {savings > 0.05 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1 bg-green-50 text-green-700">
                    Save ${savings.toFixed(2)}
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No price</p>
            )}
          </div>
        </div>

        {station.priceUpdatedAt && (
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            Updated {formatTimeAgo(station.priceUpdatedAt)}
          </div>
        )}

        {!compact && (
          <Button
            size="sm"
            className="w-full mt-3"
            onClick={handleNavigate}
          >
            <Navigation className="h-4 w-4 mr-1.5" />
            Navigate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
