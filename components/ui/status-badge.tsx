'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type StatusType =
    | 'REPORTED'
    | 'DISPATCHED'
    | 'IN_PROGRESS'
    | 'WAITING_PARTS'
    | 'COMPLETED'
    | 'RESOLVED';

export type PriorityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface StatusBadgeProps {
    status: string;
    type?: 'status' | 'priority';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
    REPORTED: { label: 'Reported', className: 'bg-gray-500 text-white' },
    DISPATCHED: { label: 'Dispatched', className: 'bg-blue-500 text-white' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-yellow-500 text-white' },
    WAITING_PARTS: { label: 'Waiting Parts', className: 'bg-orange-500 text-white' },
    COMPLETED: { label: 'Completed', className: 'bg-green-500 text-white' },
    RESOLVED: { label: 'Resolved', className: 'bg-green-600 text-white' },
};

const priorityConfig: Record<PriorityType, { label: string; className: string; emoji: string }> = {
    CRITICAL: { label: 'CRIT', className: 'bg-red-500 text-white', emoji: '🔴' },
    HIGH: { label: 'HIGH', className: 'bg-orange-500 text-white', emoji: '🟡' },
    MEDIUM: { label: 'MED', className: 'bg-yellow-500 text-white', emoji: '🟢' },
    LOW: { label: 'LOW', className: 'bg-blue-500 text-white', emoji: '⚪' },
};

const sizeClasses = {
    xs: 'text-[10px] h-4 px-1.5',
    sm: 'text-xs h-5 px-2',
    md: 'text-sm h-6 px-2.5',
    lg: 'text-base h-7 px-3',
};

export function StatusBadge({ status, type = 'status', size = 'sm', className }: StatusBadgeProps) {
    if (type === 'priority') {
        const config = priorityConfig[status as PriorityType];
        if (!config) return <Badge className={className}>{status}</Badge>;

        return (
            <Badge className={cn(config.className, sizeClasses[size], 'font-medium', className)}>
                {size !== 'xs' && `${config.emoji} `}{config.label}
            </Badge>
        );
    }

    const config = statusConfig[status as StatusType];
    if (!config) {
        return (
            <Badge className={cn(sizeClasses[size], className)}>
                {status.replace(/_/g, ' ')}
            </Badge>
        );
    }

    return (
        <Badge className={cn(config.className, sizeClasses[size], className)}>
            {config.label}
        </Badge>
    );
}

export function getPriorityBadge(priority: string, size: 'xs' | 'sm' | 'md' | 'lg' = 'sm') {
    return <StatusBadge status={priority} type="priority" size={size} />;
}

export function getStatusBadge(status: string, size: 'xs' | 'sm' | 'md' | 'lg' = 'sm') {
    return <StatusBadge status={status} type="status" size={size} />;
}
