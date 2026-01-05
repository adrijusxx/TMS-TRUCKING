'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import {
    Truck,
    Package,
    TrendingUp,
    Clock,
    MapPin,
    ChevronDown,
    ChevronUp,
    Phone
} from 'lucide-react';
import DriverLocationBadge from './DriverLocationBadge';

interface DriverStats {
    activeLoads: number;
    loadsLast30Days: number;
    revenueLast30Days: number;
    milesLast30Days: number;
    onTimePercentage: number;
}

interface Driver {
    id: string;
    name: string;
    phone: string | null;
    status: string;
    dispatchStatus: string | null;
    mcNumber: string | null;
    currentTruck: {
        id: string;
        unitNumber: string;
        make: string;
        model: string;
        samsaraVehicleId: string | null;
    } | null;
    currentTrailer: {
        id: string;
        unitNumber: string;
        type: string;
    } | null;
    stats: DriverStats;
}

interface DriverCardsGridProps {
    drivers: Driver[];
    selectedDriverId: string | null;
    onSelectDriver: (id: string | null) => void;
}

export default function DriverCardsGrid({
    drivers,
    selectedDriverId,
    onSelectDriver
}: DriverCardsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {drivers.map((driver) => (
                <DriverCard
                    key={driver.id}
                    driver={driver}
                    isSelected={selectedDriverId === driver.id}
                    onSelect={() => onSelectDriver(
                        selectedDriverId === driver.id ? null : driver.id
                    )}
                />
            ))}
        </div>
    );
}

interface DriverCardProps {
    driver: Driver;
    isSelected: boolean;
    onSelect: () => void;
}

function DriverCard({ driver, isSelected, onSelect }: DriverCardProps) {
    const [expanded, setExpanded] = useState(false);

    const statusColor = {
        AVAILABLE: 'bg-green-500/10 text-green-500 border-green-500/20',
        ON_DUTY: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        OFF_DUTY: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        SLEEPER: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        DRIVING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    }[driver.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

    return (
        <Card
            className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                isSelected && 'ring-2 ring-primary border-primary'
            )}
            onClick={onSelect}
        >
            <CardContent className="p-3 space-y-2">
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">{driver.name}</h3>
                        {driver.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{driver.phone}</span>
                            </div>
                        )}
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] shrink-0', statusColor)}>
                        {driver.status.replace('_', ' ')}
                    </Badge>
                </div>

                {/* Truck/Trailer Info */}
                <div className="flex items-center gap-3 text-xs">
                    {driver.currentTruck && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Truck className="h-3 w-3" />
                            <span className="font-medium">{driver.currentTruck.unitNumber}</span>
                        </div>
                    )}
                    {driver.currentTrailer && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-muted-foreground/50">|</span>
                            <span>{driver.currentTrailer.unitNumber}</span>
                        </div>
                    )}
                    {!driver.currentTruck && !driver.currentTrailer && (
                        <span className="text-muted-foreground italic">No equipment assigned</span>
                    )}
                </div>

                {/* Quick Stats Row */}
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-blue-500" />
                        <span className="font-medium">{driver.stats.activeLoads}</span>
                        <span className="text-muted-foreground">active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-green-500" />
                        <span className="font-medium">{driver.stats.onTimePercentage}%</span>
                        <span className="text-muted-foreground">on-time</span>
                    </div>
                </div>

                {/* Location Badge (Samsara) */}
                {driver.currentTruck?.samsaraVehicleId && (
                    <DriverLocationBadge
                        samsaraVehicleId={driver.currentTruck.samsaraVehicleId}
                    />
                )}

                {/* Expand/Collapse */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-6 text-xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            More Stats
                        </>
                    )}
                </Button>

                {/* Expanded Stats */}
                {expanded && (
                    <div className="pt-2 border-t space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">30-Day Loads</span>
                            <span className="font-medium">{driver.stats.loadsLast30Days}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">30-Day Revenue</span>
                            <span className="font-medium text-emerald-500">
                                {formatCurrency(driver.stats.revenueLast30Days)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">30-Day Miles</span>
                            <span className="font-medium">
                                {driver.stats.milesLast30Days?.toLocaleString() || 0}
                            </span>
                        </div>
                        {driver.mcNumber && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">MC Number</span>
                                <span className="font-medium">{driver.mcNumber}</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
