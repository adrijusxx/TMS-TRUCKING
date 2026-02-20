/**
 * ETA Calculator for Trucking Operations
 * Calculates estimated time of arrival based on current location, speed, and destination
 */

import { haversineDistanceMiles } from '@/lib/utils/geo';

export interface ETAResult {
  etaTime: Date;
  etaFormatted: string;
  remainingMiles: number;
  remainingMinutes: number;
  status: 'ON_TIME' | 'AT_RISK' | 'LATE';
  statusReason?: string;
}

export interface ETAInput {
  currentLat: number;
  currentLng: number;
  destinationLat: number;
  destinationLng: number;
  currentSpeed?: number;
  scheduledArrival?: Date;
}

/**
 * Calculate ETA based on current position, speed, and destination
 */
export function calculateETA(input: ETAInput): ETAResult | null {
  const { 
    currentLat, currentLng, 
    destinationLat, destinationLng, 
    currentSpeed = 0,
    scheduledArrival 
  } = input;

  // Validate inputs
  if (!currentLat || !currentLng || !destinationLat || !destinationLng) {
    return null;
  }

  // Calculate straight-line distance
  const straightLineDistance = haversineDistanceMiles(
    currentLat, currentLng,
    destinationLat, destinationLng
  );

  // Apply road factor (typically roads are ~30% longer than straight line)
  const ROAD_FACTOR = 1.3;
  const remainingMiles = Math.round(straightLineDistance * ROAD_FACTOR);

  if (remainingMiles < 1) {
    return {
      etaTime: new Date(),
      etaFormatted: 'Arrived',
      remainingMiles: 0,
      remainingMinutes: 0,
      status: 'ON_TIME',
    };
  }

  // Estimate average speed
  // If stopped, use 55 mph average. Otherwise use current speed capped at 65
  const AVG_SPEED_STOPPED = 55;
  const MAX_SPEED = 65;
  const effectiveSpeed = currentSpeed > 5 
    ? Math.min(currentSpeed, MAX_SPEED)
    : AVG_SPEED_STOPPED;

  // Calculate time remaining
  const hoursRemaining = remainingMiles / effectiveSpeed;
  const remainingMinutes = Math.round(hoursRemaining * 60);
  
  // Calculate ETA
  const etaTime = new Date(Date.now() + hoursRemaining * 3600000);

  // Format ETA
  const etaFormatted = formatETATime(etaTime, remainingMinutes);

  // Determine status
  let status: ETAResult['status'] = 'ON_TIME';
  let statusReason: string | undefined;

  if (scheduledArrival) {
    const scheduledTime = new Date(scheduledArrival).getTime();
    const etaTimestamp = etaTime.getTime();
    const diffMinutes = (etaTimestamp - scheduledTime) / 60000;

    if (diffMinutes > 30) {
      status = 'LATE';
      statusReason = `${Math.round(diffMinutes)} min late`;
    } else if (diffMinutes > 0 || currentSpeed < 5) {
      status = 'AT_RISK';
      statusReason = currentSpeed < 5 ? 'Currently stopped' : 'Cutting it close';
    }
  } else {
    // Without scheduled arrival, use heuristics
    if (currentSpeed < 5 && remainingMiles > 50) {
      status = 'AT_RISK';
      statusReason = 'Stopped with distance remaining';
    } else if (remainingMinutes > 480) { // > 8 hours
      status = 'AT_RISK';
      statusReason = 'Long distance remaining';
    }
  }

  return {
    etaTime,
    etaFormatted,
    remainingMiles,
    remainingMinutes,
    status,
    statusReason,
  };
}

/**
 * Format ETA time for display
 */
function formatETATime(eta: Date, remainingMinutes: number): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const etaDate = new Date(eta.getFullYear(), eta.getMonth(), eta.getDate());

  const timeStr = eta.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // If less than 60 minutes, show relative time
  if (remainingMinutes < 60) {
    return `${remainingMinutes} min`;
  }

  // If less than 6 hours, show relative + time
  if (remainingMinutes < 360) {
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m (${timeStr})` : `${hours}h (${timeStr})`;
  }

  // Otherwise show day + time
  if (etaDate.getTime() === today.getTime()) {
    return `Today ${timeStr}`;
  } else if (etaDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${timeStr}`;
  } else {
    return eta.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

/**
 * Get ETA status color for UI
 */
export function getETAStatusColor(status: ETAResult['status']): string {
  switch (status) {
    case 'ON_TIME': return 'text-green-600';
    case 'AT_RISK': return 'text-amber-600';
    case 'LATE': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
}

/**
 * Get ETA badge variant
 */
export function getETABadgeVariant(status: ETAResult['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ON_TIME': return 'secondary';
    case 'AT_RISK': return 'outline';
    case 'LATE': return 'destructive';
    default: return 'outline';
  }
}





