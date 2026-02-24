'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Container, ExternalLink, MapPin, Wrench, Home, Satellite } from 'lucide-react';
import Link from 'next/link';
import type {
  TruckInventoryItem, TrailerInventoryItem,
  OOSEquipmentRef, IdleDriver, DormantEquipment,
} from '@/lib/managers/fleet-monitoring/types';

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  MAINTENANCE_DUE: 'bg-amber-100 text-amber-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800',
  NEEDS_REPAIR: 'bg-orange-100 text-orange-800',
  INACTIVE: 'bg-slate-100 text-slate-800',
};

export function idleBadge(days: number | null) {
  if (days === null) return null;
  if (days >= 7) return { label: `${days}d`, variant: 'destructive' as const };
  if (days >= 3) return { label: `${days}d`, variant: 'warning' as const };
  return { label: `${days}d`, variant: 'secondary' as const };
}

export function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(date: Date | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getIdleHoursBadge(hours: number) {
  if (hours >= 48) return { label: `${Math.round(hours)}h`, variant: 'destructive' as const };
  if (hours >= 24) return { label: `${Math.round(hours)}h`, variant: 'warning' as const };
  return { label: `${Math.round(hours)}h`, variant: 'secondary' as const };
}

function getDormantBadge(days: number) {
  if (days >= 7) return { label: `${days}d`, variant: 'destructive' as const };
  if (days >= 5) return { label: `${days}d`, variant: 'warning' as const };
  return { label: `${days}d`, variant: 'secondary' as const };
}

/* ─── Shared cells for Truck/Trailer inventory rows ─── */

function InventorySharedCells({ item }: {
  item: { activeLoad: any; lastLoad: any; daysSinceLastLoad: number | null; samsaraLocation: any; oosInfo: any };
}) {
  const idle = idleBadge(item.daysSinceLastLoad);
  return (
    <>
      <td className="py-2 pr-3 text-xs">
        {item.activeLoad ? (
          <div>
            <div className="font-medium">{item.activeLoad.lane}</div>
            <div className="text-muted-foreground">
              {formatDate(item.activeLoad.pickupDate)} – {formatDate(item.activeLoad.deliveryDate)}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">No active load</span>
        )}
      </td>
      <td className="py-2 pr-3 text-xs">
        {item.lastLoad ? (
          <div>
            <span>{item.lastLoad.loadNumber}</span>
            <span className="text-muted-foreground ml-1">{formatDate(item.lastLoad.date)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Never</span>
        )}
      </td>
      <td className="py-2 pr-3">
        {idle ? <Badge variant={idle.variant}>{idle.label}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="py-2 pr-3 text-xs max-w-[140px]">
        {item.samsaraLocation ? (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{item.samsaraLocation.address}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No GPS</span>
        )}
      </td>
      <td className="py-2 pr-3 text-xs">
        {item.oosInfo.longTermOutOfService ? (
          <div className="flex items-center gap-1 text-red-600">
            <Wrench className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{item.oosInfo.reason || 'OOS'}</span>
          </div>
        ) : null}
      </td>
    </>
  );
}

/* ─── Truck Row ─── */

export function TruckRow({ truck, onMarkOOS }: { truck: TruckInventoryItem; onMarkOOS: (ref: OOSEquipmentRef) => void }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-2 pr-3 font-medium">{truck.truckNumber}</td>
      <td className="py-2 pr-3 text-muted-foreground text-xs">{truck.year} {truck.make} {truck.model}</td>
      <td className="py-2 pr-3">
        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[truck.status] || ''}`}>
          {truck.status.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="py-2 pr-3 text-xs">
        {truck.currentDriver ? truck.currentDriver.name : <span className="text-muted-foreground">Unassigned</span>}
      </td>
      <InventorySharedCells item={truck} />
      <td className="py-2">
        <div className="flex items-center gap-1">
          {!truck.oosInfo.longTermOutOfService && (
            <Button variant="ghost" size="sm" className="text-xs h-7"
              onClick={() => onMarkOOS({ id: truck.id, number: truck.truckNumber, type: 'TRUCK' })}>
              Mark OOS
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/trucks/${truck.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Trailer Row ─── */

export function TrailerRow({ trailer, onMarkOOS }: { trailer: TrailerInventoryItem; onMarkOOS: (ref: OOSEquipmentRef) => void }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-2 pr-3 font-medium">{trailer.trailerNumber}</td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{trailer.type || '—'}</td>
      <td className="py-2 pr-3 text-muted-foreground text-xs">{trailer.year} {trailer.make} {trailer.model}</td>
      <td className="py-2 pr-3">
        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[trailer.status] || ''}`}>
          {trailer.status.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="py-2 pr-3 text-xs">
        {trailer.assignedTruck ? (
          <Link href={`/dashboard/trucks/${trailer.assignedTruck.id}`} className="text-primary hover:underline">
            {trailer.assignedTruck.truckNumber}
          </Link>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </td>
      <InventorySharedCells item={trailer} />
      <td className="py-2">
        <div className="flex items-center gap-1">
          {!trailer.oosInfo.longTermOutOfService && (
            <Button variant="ghost" size="sm" className="text-xs h-7"
              onClick={() => onMarkOOS({ id: trailer.id, number: trailer.trailerNumber, type: 'TRAILER' })}>
              Mark OOS
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/trailers/${trailer.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Idle Driver Row ─── */

export function IdleDriverRow({ driver }: { driver: IdleDriver }) {
  const badge = getIdleHoursBadge(driver.idleHours);
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-2.5 pr-3">
        <div>
          <p className="font-medium">{driver.driverName}</p>
          <p className="text-xs text-muted-foreground">#{driver.driverNumber}</p>
        </div>
      </td>
      <td className="py-2.5 pr-3 text-muted-foreground text-xs">{driver.homeTerminal || '—'}</td>
      <td className="py-2.5 pr-3 text-xs">
        {driver.lastLoadNumber && <p>{driver.lastLoadNumber}</p>}
        <p className="text-muted-foreground">{formatDateTime(driver.lastDeliveredAt)}</p>
      </td>
      <td className="py-2.5 pr-3">
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </td>
      <td className="py-2.5 pr-3 text-xs">
        {driver.currentLocation ? (
          <div className="flex items-center gap-1">
            {driver.isAtHomeTerminal ? (
              <Home className="h-3 w-3 text-green-600" />
            ) : (
              <MapPin className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="max-w-[150px] truncate">{driver.currentLocation}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No GPS</span>
        )}
      </td>
      <td className="py-2.5">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/drivers/${driver.driverId}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
        </Button>
      </td>
    </tr>
  );
}

/* ─── Dormant Equipment Row ─── */

export function DormantEquipmentRow({ eq, onMarkOOS }: { eq: DormantEquipment; onMarkOOS: (ref: OOSEquipmentRef) => void }) {
  const badge = getDormantBadge(eq.daysSinceLastLoad);
  const href = eq.type === 'TRUCK' ? `/dashboard/trucks/${eq.id}` : `/dashboard/trailers/${eq.id}`;
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2">
          {eq.type === 'TRUCK' ? <Truck className="h-3.5 w-3.5 text-muted-foreground" /> : <Container className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="font-medium">{eq.number}</span>
        </div>
      </td>
      <td className="py-2.5 pr-3"><Badge variant="outline" className="text-xs">{eq.type}</Badge></td>
      <td className="py-2.5 pr-3 text-xs">
        {eq.lastActiveLoadNumber && <p>{eq.lastActiveLoadNumber}</p>}
        <p className="text-muted-foreground">{formatDate(eq.lastActiveLoadDate)}</p>
      </td>
      <td className="py-2.5 pr-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
      <td className="py-2.5 pr-3 text-xs">
        {eq.hasSamsaraMovement === null ? (
          <span className="text-muted-foreground">No GPS</span>
        ) : eq.hasSamsaraMovement ? (
          <div className="flex items-center gap-1 text-green-600"><Satellite className="h-3 w-3" /> Moving</div>
        ) : (
          <div className="flex items-center gap-1 text-red-600"><Satellite className="h-3 w-3" /> Stationary</div>
        )}
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onMarkOOS({ id: eq.id, number: eq.number, type: eq.type })}>
            Mark OOS
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}><ExternalLink className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}
