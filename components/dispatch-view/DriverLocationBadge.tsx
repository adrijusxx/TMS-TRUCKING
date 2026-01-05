'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface DriverLocationBadgeProps {
    samsaraVehicleId: string;
}

interface LocationData {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    address?: string;
    city?: string;
    state?: string;
}

async function fetchVehicleLocation(samsaraVehicleId: string): Promise<LocationData | null> {
    try {
        const res = await fetch(apiUrl(`/api/maps/live?vehicleId=${samsaraVehicleId}`));
        if (!res.ok) return null;
        const json = await res.json();

        // Handle different response formats
        if (json.data?.vehicles?.[0]?.location) {
            const loc = json.data.vehicles[0].location;
            return {
                latitude: loc.latitude,
                longitude: loc.longitude,
                speed: loc.speed || 0,
                heading: loc.heading || 0,
                address: loc.address,
                city: loc.city,
                state: loc.state,
            };
        }

        return null;
    } catch {
        return null;
    }
}

export default function DriverLocationBadge({ samsaraVehicleId }: DriverLocationBadgeProps) {
    const { data: location, isLoading } = useQuery({
        queryKey: ['vehicle-location', samsaraVehicleId],
        queryFn: () => fetchVehicleLocation(samsaraVehicleId),
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refresh every minute
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading location...</span>
            </div>
        );
    }

    if (!location) {
        return null;
    }

    const locationText = location.city && location.state
        ? `${location.city}, ${location.state}`
        : location.address || 'Unknown location';

    const isMoving = location.speed > 5;

    return (
        <div className="flex items-center gap-1.5">
            <Badge
                variant="outline"
                className={`text-[10px] ${isMoving ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
            >
                <MapPin className="h-2.5 w-2.5 mr-1" />
                {locationText}
            </Badge>
            {isMoving && (
                <span className="text-[10px] text-muted-foreground">
                    {Math.round(location.speed)} mph
                </span>
            )}
        </div>
    );
}
