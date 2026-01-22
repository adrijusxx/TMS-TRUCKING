'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface UsageMeterProps {
    label: string;
    used: number;
    limit: number | null;
    icon?: ReactNode;
    showPercentage?: boolean;
}

/**
 * Visual usage meter for displaying usage-based limits
 * Supports unlimited limits (null) and warning/exceeded states
 */
export function UsageMeter({ label, used, limit, icon, showPercentage = false }: UsageMeterProps) {
    const isUnlimited = limit === null;
    const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
    const isWarning = !isUnlimited && percentage >= 80;
    const isExceeded = !isUnlimited && percentage >= 100;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                    {icon}
                    {label}
                </span>
                <span className={cn(
                    'font-mono text-xs',
                    isExceeded ? 'text-red-500 font-semibold' : isWarning ? 'text-amber-500' : 'text-muted-foreground'
                )}>
                    {isUnlimited ? (
                        <span className="text-green-500">∞ Unlimited</span>
                    ) : (
                        <>
                            {used}/{limit}
                            {showPercentage && ` (${Math.round(percentage)}%)`}
                        </>
                    )}
                </span>
            </div>
            {!isUnlimited && (
                <Progress
                    value={percentage}
                    className={cn(
                        'h-2',
                        isExceeded ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-amber-500' : '[&>div]:bg-primary'
                    )}
                />
            )}
            {isUnlimited && (
                <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-green-500/50 to-green-500/20 animate-pulse" />
                </div>
            )}
        </div>
    );
}

/**
 * Compact inline usage badge for banners and headers
 */
export function UsageBadge({ used, limit, label }: { used: number; limit: number | null; label?: string }) {
    const isUnlimited = limit === null;
    const remaining = isUnlimited ? null : Math.max(0, limit - used);
    const isLow = !isUnlimited && remaining !== null && remaining <= 2;

    return (
        <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            isUnlimited
                ? 'bg-green-500/20 text-green-600'
                : isLow
                    ? 'bg-red-500/20 text-red-600'
                    : 'bg-primary/20 text-primary'
        )}>
            {isUnlimited ? (
                '∞ Unlimited'
            ) : (
                <>
                    {remaining} {label || 'remaining'}
                </>
            )}
        </span>
    );
}
