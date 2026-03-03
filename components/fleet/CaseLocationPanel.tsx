'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Truck, User, Phone, Navigation, Clock, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '@/lib/utils';

interface CaseLocationPanelProps {
    breakdown: {
        id: string;
        breakdownNumber: string;
        location: string;
        latitude?: number | null;
        longitude?: number | null;
        priority: string;
        status: string;
        reportedAt?: string;
        dispatchedAt?: string;
        arrivedAt?: string;
        repairStartedAt?: string;
        repairCompletedAt?: string;
        truckReadyAt?: string;
        downtimeHours?: number;
        truck: { id: string; truckNumber: string; make?: string; model?: string; samsaraId?: string | null };
        driver?: { id: string; user: { firstName: string; lastName: string; phone?: string; email?: string } } | null;
    };
}

export default function CaseLocationPanel({ breakdown }: CaseLocationPanelProps) {
    const samsaraId = breakdown.truck.samsaraId;

    const { data: samsaraLocation } = useQuery({
        queryKey: ['samsara-location', samsaraId],
        queryFn: async () => {
            if (!samsaraId) return null;
            const res = await fetch(apiUrl(`/api/fleet/device-queue?action=vehicle-location&samsaraId=${samsaraId}`));
            if (!res.ok) return null;
            const json = await res.json();
            return json.data?.location || null;
        },
        enabled: !!samsaraId,
        refetchInterval: 60000,
        staleTime: 30000,
    });

    // Reported location
    const reportedAddr = breakdown.location || 'Unknown';
    const reportedLat = breakdown.latitude;
    const reportedLng = breakdown.longitude;
    const hasReportedCoords = reportedLat && reportedLng;
    const reportedMapsUrl = hasReportedCoords ? `https://www.google.com/maps?q=${reportedLat},${reportedLng}` : null;

    // Current GPS location (Samsara)
    const gpsLat = samsaraLocation?.latitude;
    const gpsLng = samsaraLocation?.longitude;
    const gpsAddr = samsaraLocation?.formattedAddress || samsaraLocation?.address;
    const hasGpsCoords = gpsLat && gpsLng;
    const gpsMapsUrl = hasGpsCoords ? `https://www.google.com/maps?q=${gpsLat},${gpsLng}` : null;

    // Use GPS coords for map if available, otherwise reported
    const mapLat = gpsLat || reportedLat;
    const mapLng = gpsLng || reportedLng;
    const hasMapCoords = mapLat && mapLng;

    const events = [
        { label: 'Reported', time: breakdown.reportedAt },
        { label: 'Dispatched', time: breakdown.dispatchedAt },
        { label: 'Arrived', time: breakdown.arrivedAt },
        { label: 'Repair Started', time: breakdown.repairStartedAt },
        { label: 'Completed', time: breakdown.repairCompletedAt },
        { label: 'Truck Ready', time: breakdown.truckReadyAt },
    ];

    const truckLabel = [breakdown.truck.truckNumber, breakdown.truck.make, breakdown.truck.model]
        .filter(Boolean).join(' · ');

    return (
        <div className="space-y-3">
            {/* Truck & Driver */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{truckLabel}</span>
                </div>
                {breakdown.driver && (
                    <div className="flex items-center gap-2 text-xs">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                            {breakdown.driver.user.firstName} {breakdown.driver.user.lastName}
                        </span>
                        {breakdown.driver.user.phone && (
                            <a href={`tel:${breakdown.driver.user.phone}`}
                                className="text-primary flex items-center gap-0.5 hover:underline ml-auto">
                                <Phone className="h-3 w-3" />{breakdown.driver.user.phone}
                            </a>
                        )}
                    </div>
                )}
            </div>

            <Separator />

            {/* Reported Location */}
            <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                                Reported Location
                            </p>
                            <p className="text-xs mt-0.5 break-words leading-snug">{reportedAddr}</p>
                            {hasReportedCoords && (
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                    {Number(reportedLat).toFixed(5)}, {Number(reportedLng).toFixed(5)}
                                </p>
                            )}
                        </div>
                    </div>
                    {reportedMapsUrl && (
                        <a href={reportedMapsUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5 gap-0.5 shrink-0">
                                <Navigation className="h-2.5 w-2.5" /> Open
                            </Button>
                        </a>
                    )}
                </div>
            </div>

            {/* Current GPS Location */}
            {samsaraId && (
                <>
                    <Separator />
                    <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 min-w-0">
                                <Radio className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                                        Current Location (GPS)
                                    </p>
                                    {hasGpsCoords ? (
                                        <>
                                            <p className="text-xs mt-0.5 break-words leading-snug">
                                                {gpsAddr || 'Coordinates only'}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                {Number(gpsLat).toFixed(5)}, {Number(gpsLng).toFixed(5)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs mt-0.5 text-muted-foreground italic">
                                            Waiting for GPS data...
                                        </p>
                                    )}
                                </div>
                            </div>
                            {gpsMapsUrl && (
                                <a href={gpsMapsUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5 gap-0.5 shrink-0">
                                        <Navigation className="h-2.5 w-2.5" /> Open
                                    </Button>
                                </a>
                            )}
                        </div>
                        {samsaraLocation && (
                            <div className="flex items-center gap-1 text-[10px] text-green-600 pl-5">
                                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                                Live · Updated {samsaraLocation.time
                                    ? formatDistanceToNow(new Date(samsaraLocation.time), { addSuffix: true })
                                    : 'just now'}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Map */}
            {hasMapCoords && (
                <>
                    <Separator />
                    <div className="rounded-md overflow-hidden border h-[130px]">
                        <img
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${mapLat},${mapLng}&zoom=13&size=400x130&scale=2&markers=color:red%7C${mapLat},${mapLng}${hasGpsCoords && hasReportedCoords ? `&markers=color:orange%7C${reportedLat},${reportedLng}` : ''}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt="Map"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </>
            )}

            <Separator />

            {/* Timeline */}
            <div>
                <h4 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Timeline
                </h4>
                <div className="space-y-0">
                    {events.map((e, i) => {
                        const done = !!e.time;
                        return (
                            <div key={i} className="flex items-center gap-2 py-[3px]">
                                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${done ? 'bg-green-500' : 'bg-muted-foreground/20'}`} />
                                <span className={`text-[11px] flex-1 ${done ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                    {e.label}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                                    {e.time ? new Date(e.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014'}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {breakdown.downtimeHours != null && breakdown.downtimeHours > 0 && (
                    <div className="mt-1.5 flex items-center justify-between px-2 py-1 bg-orange-500/10 rounded text-[11px]">
                        <span className="text-orange-600">Downtime</span>
                        <span className="font-bold text-orange-700 dark:text-orange-300">
                            {breakdown.downtimeHours.toFixed(1)}h
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
