'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, MapPin, Truck as TruckIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export type LaneDisplayVariant = 'compact' | 'vertical' | 'progress';

export interface LaneDisplayProps {
    /** Origin state code (e.g., "NC", "TX") */
    originState: string;
    /** Destination state code */
    destinationState: string;
    /** Origin city name (optional) */
    originCity?: string;
    /** Destination city name (optional) */
    destinationCity?: string;
    /** Status for color coding */
    status?: 'pending' | 'in-progress' | 'delivered' | 'error';
    /** Display variant */
    variant?: LaneDisplayVariant;
    /** Total distance in miles (for progress variant) */
    miles?: number;
    /** Estimated time (for progress variant) */
    estimatedTime?: string;
    /** Progress percentage 0-100 (for progress variant) */
    progress?: number;
    /** Additional class names */
    className?: string;
    /** Click handler */
    onClick?: () => void;
}

const STATUS_COLORS = {
    pending: 'warning',
    'in-progress': 'info',
    delivered: 'success',
    error: 'error',
} as const;

/**
 * LaneDisplay - A component for displaying origin/destination pairs
 * 
 * Three variants:
 * - `compact`: Inline chip format, best for tables (default)
 * - `vertical`: Stacked format, best for detail panels
 * - `progress`: Mini progress bar with truck icon, best for tracking views
 */
export function LaneDisplay({
    originState,
    destinationState,
    originCity,
    destinationCity,
    status,
    variant = 'compact',
    miles,
    estimatedTime,
    progress = 0,
    className,
    onClick,
}: LaneDisplayProps) {
    const statusColor = status ? STATUS_COLORS[status] : undefined;

    // Compact variant: NC → TN
    if (variant === 'compact') {
        const content = (
            <div
                className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-md text-caption font-medium',
                    'bg-muted/50 hover:bg-muted transition-colors',
                    onClick && 'cursor-pointer',
                    className
                )}
                onClick={onClick}
            >
                {status && (
                    <span
                        className={cn(
                            'h-2 w-2 rounded-full flex-shrink-0',
                            statusColor === 'warning' && 'bg-status-warning',
                            statusColor === 'info' && 'bg-status-info',
                            statusColor === 'success' && 'bg-status-success',
                            statusColor === 'error' && 'bg-status-error'
                        )}
                    />
                )}
                <span className="font-semibold">{originState}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">{destinationState}</span>
                {(originCity || destinationCity) && (
                    <span className="text-muted-foreground hidden sm:inline truncate max-w-[120px]">
                        {originCity && destinationCity
                            ? `${originCity} → ${destinationCity}`
                            : originCity || destinationCity}
                    </span>
                )}
            </div>
        );

        // Wrap with tooltip if we have city names
        if (originCity || destinationCity) {
            return (
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent>
                            <p className="font-medium">
                                {originCity || originState}, {originState}
                            </p>
                            <p className="text-muted-foreground">↓</p>
                            <p className="font-medium">
                                {destinationCity || destinationState}, {destinationState}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return content;
    }

    // Vertical variant: Stacked format
    if (variant === 'vertical') {
        return (
            <div
                className={cn(
                    'flex flex-col gap-2 p-3 rounded-lg border bg-card',
                    onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
                    className
                )}
                onClick={onClick}
            >
                <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center">
                        <MapPin className="h-4 w-4 text-status-info" />
                        <div className="w-px h-4 bg-border" />
                        <MapPin className="h-4 w-4 text-status-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-micro text-muted-foreground uppercase tracking-wide">
                                Pickup
                            </span>
                            {status && (
                                <Badge variant={statusColor} size="xs">
                                    {status.replace('-', ' ')}
                                </Badge>
                            )}
                        </div>
                        <p className="font-medium text-data truncate">
                            {originCity ? `${originCity}, ${originState}` : originState}
                        </p>

                        <div className="mt-3">
                            <span className="text-micro text-muted-foreground uppercase tracking-wide">
                                Delivery
                            </span>
                            <p className="font-medium text-data truncate">
                                {destinationCity
                                    ? `${destinationCity}, ${destinationState}`
                                    : destinationState}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Progress variant: Mini progress bar with truck
    if (variant === 'progress') {
        const clampedProgress = Math.min(100, Math.max(0, progress));

        return (
            <div
                className={cn(
                    'flex flex-col gap-1 p-2 rounded-lg bg-muted/30',
                    onClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
                    className
                )}
                onClick={onClick}
            >
                <div className="flex items-center justify-between text-caption">
                    <span className="font-semibold">{originState}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-semibold">{destinationState}</span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="absolute left-0 top-0 h-full bg-status-info transition-all duration-300"
                        style={{ width: `${clampedProgress}%` }}
                    />
                    {/* Truck icon at progress position */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 transition-all duration-300"
                        style={{ left: `calc(${clampedProgress}% - 6px)` }}
                    >
                        <TruckIcon className="h-3 w-3 text-status-info-foreground drop-shadow" />
                    </div>
                </div>

                {/* Miles and ETA */}
                {(miles || estimatedTime) && (
                    <div className="flex items-center justify-between text-micro text-muted-foreground">
                        {miles && <span>{miles.toLocaleString()} mi</span>}
                        {estimatedTime && <span>{estimatedTime}</span>}
                    </div>
                )}
            </div>
        );
    }

    return null;
}

export default LaneDisplay;
