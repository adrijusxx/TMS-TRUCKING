'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Package, Truck, User, AlertTriangle } from 'lucide-react';
import type { TruckMapEntry } from '@/lib/maps/live-map-service';
import { MAP_COLORS } from '@/lib/maps/map-config';
import type { SVGProps } from 'react';

function TrailerGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 16" fill="currentColor" {...props}>
      <rect x="1" y="3" width="20" height="10" rx="2" />
      <rect x="23" y="5" width="8" height="6" rx="1.5" />
      <circle cx="7" cy="14" r="2" fill="currentColor" />
      <circle cx="18" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

import { MapPin, Route as RouteIcon } from 'lucide-react';

interface MapOverviewPanelProps {
  activeLoadCount: number;
  trackedTruckCount: number;
  loadsWithLiveTrucks: number;
  faultyTruckCount: number;
  filteredTrucks: TruckMapEntry[];
  onSelectTruck: (detail: any) => void;
}

export default function MapOverviewPanel({
  activeLoadCount,
  trackedTruckCount,
  loadsWithLiveTrucks,
  faultyTruckCount,
  filteredTrucks,
  onSelectTruck,
}: MapOverviewPanelProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showTrackedTrucks, setShowTrackedTrucks] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const legendItems = [
    { label: 'Truck (Healthy)', color: MAP_COLORS.healthy, icon: Truck },
    { label: 'Truck (Faulty)', color: MAP_COLORS.faulty, icon: Truck },
    { label: 'Truck (Assigned)', color: MAP_COLORS.assigned, icon: Truck },
    { label: 'Trailer', color: MAP_COLORS.trailer, icon: TrailerGlyph },
    { label: 'Pickup', color: MAP_COLORS.pickup, icon: MapPin },
    { label: 'Delivery', color: MAP_COLORS.delivery, icon: RouteIcon },
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-2 pt-4 border-t">
      {/* Statistics */}
      <Collapsible open={showStatistics} onOpenChange={setShowStatistics}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
          <div className="flex items-center gap-2">
            {showStatistics ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium">Statistics</span>
            <Badge variant="secondary" className="text-xs">
              {activeLoadCount} loads, {trackedTruckCount} trucks
            </Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 pb-4">
            <StatCard icon={Package} color="text-blue-600" label="Active Loads" value={activeLoadCount} />
            <StatCard icon={Truck} color="text-green-600" label="Tracked Trucks" value={trackedTruckCount} />
            <StatCard icon={User} color="text-purple-600" label="Loads w/ Live Truck" value={loadsWithLiveTrucks} />
            <StatCard icon={AlertTriangle} color="text-red-600" label="Faulty Trucks" value={faultyTruckCount} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Legend */}
      <Collapsible open={showLegend} onOpenChange={setShowLegend}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
          <div className="flex items-center gap-2">
            {showLegend ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium">Map Legend</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 pb-4">
            {legendItems.map(({ label, color, icon: Icon }) => {
              const IconComponent = Icon as React.ComponentType<{ className?: string }>;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center rounded-md border px-2 py-1"
                    style={{ borderColor: color, color }}
                  >
                    <IconComponent className="h-4 w-4" />
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tracked Trucks List */}
      <Collapsible open={showTrackedTrucks} onOpenChange={setShowTrackedTrucks}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
          <div className="flex items-center gap-2">
            {showTrackedTrucks ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium">Tracked Trucks</span>
            <Badge variant="secondary" className="text-xs">{filteredTrucks.length}</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pb-4">
            {filteredTrucks.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 border rounded-lg">No trucks match this filter.</div>
            ) : (
              <div className="max-h-72 overflow-auto divide-y rounded-lg border">
                {filteredTrucks.map((truck) => (
                  <button
                    key={truck.id}
                    className="w-full text-left px-4 py-3 hover:bg-muted/70 flex items-center justify-between gap-4 transition-colors"
                    onClick={() => onSelectTruck({
                      truckId: truck.id,
                      truckNumber: truck.truckNumber,
                      status: truck.status,
                      location: truck.location,
                      diagnostics: truck.diagnostics,
                      matchSource: truck.matchSource,
                      sensors: truck.sensors,
                      latestMedia: truck.latestMedia,
                      recentTrips: truck.recentTrips,
                    })}
                  >
                    <div>
                      <div className="font-medium">{truck.truckNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        Status: {truck.status}
                        {truck.matchSource ? ` - Match: ${truck.matchSource}` : ''}
                      </div>
                    </div>
                    {truck.diagnostics?.activeFaults ? (
                      <Badge variant="destructive">
                        {truck.diagnostics.activeFaults} active fault{truck.diagnostics.activeFaults > 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Healthy</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
      <Icon className={`h-6 w-6 ${color}`} />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
