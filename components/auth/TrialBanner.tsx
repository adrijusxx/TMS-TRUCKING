'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, X } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TrialBannerProps {
    trialEndsAt?: Date | string | null;
    subscriptionStatus?: string;
    className?: string;
}

/**
 * Trial Banner Component
 * 
 * Shows a persistent banner at the top of the dashboard for trial users,
 * displaying days remaining and upgrade options.
 */
export function TrialBanner({
    trialEndsAt,
    subscriptionStatus,
    className
}: TrialBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (trialEndsAt) {
            const endDate = new Date(trialEndsAt);
            const days = differenceInDays(endDate, new Date());
            setDaysRemaining(Math.max(0, days));
        }
    }, [trialEndsAt]);

    // Don't show if dismissed or not in trial
    if (isDismissed || subscriptionStatus !== 'TRIALING') {
        return null;
    }

    // Determine urgency level for styling
    const isUrgent = daysRemaining !== null && daysRemaining <= 3;
    const isWarning = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 3;

    return (
        <div
            className={cn(
                'relative px-4 py-2 text-sm flex items-center justify-center gap-3',
                isUrgent
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                    : isWarning
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white',
                className
            )}
        >
            <Clock className="h-4 w-4 flex-shrink-0" />

            <span>
                {daysRemaining !== null ? (
                    daysRemaining === 0 ? (
                        <span className="font-medium">Your trial ends today!</span>
                    ) : daysRemaining === 1 ? (
                        <span><span className="font-medium">1 day left</span> in your Pro Trial</span>
                    ) : (
                        <span><span className="font-medium">{daysRemaining} days left</span> in your Pro Trial</span>
                    )
                ) : (
                    <span>You're on a <span className="font-medium">Pro Trial</span></span>
                )}
            </span>

            <div className="flex items-center gap-2">
                <Link href="/dashboard/settings/billing">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Upgrade Now
                    </Button>
                </Link>

                <Link
                    href="/pricing"
                    className="text-white/80 hover:text-white text-xs underline-offset-2 hover:underline"
                >
                    See Plans
                </Link>
            </div>

            {/* Dismiss Button */}
            <button
                onClick={() => setIsDismissed(true)}
                className="absolute right-2 p-1 text-white/60 hover:text-white transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

/**
 * Owner-Operator Banner
 * Shows for users on the free Owner-Operator tier
 */
export function OwnerOperatorBanner({ className }: { className?: string }) {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) {
        return null;
    }

    return (
        <div
            className={cn(
                'relative px-4 py-2 text-sm flex items-center justify-center gap-3',
                'bg-gradient-to-r from-slate-700 to-slate-800 text-white',
                className
            )}
        >
            <span>
                You're on the <span className="font-medium">Free Owner-Operator</span> plan (1 truck limit)
            </span>

            <Link href="/dashboard/settings/billing">
                <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-3 text-xs bg-purple-500 hover:bg-purple-600 text-white border-0"
                >
                    Upgrade for More Trucks
                </Button>
            </Link>

            <button
                onClick={() => setIsDismissed(true)}
                className="absolute right-2 p-1 text-white/60 hover:text-white transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

/**
 * Read-Only Banner (Core Tier)
 * Shows for users whose trial has expired
 */
export function ReadOnlyBanner({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'px-4 py-3 text-sm flex items-center justify-center gap-3',
                'bg-gradient-to-r from-red-900 to-red-800 text-white',
                className
            )}
        >
            <span className="font-medium">
                ⚠️ Your trial has expired. Your data is safe, but you're in read-only mode.
            </span>

            <Link href="/dashboard/settings/billing">
                <Button
                    size="sm"
                    className="h-8 px-4 bg-white text-red-700 hover:bg-white/90 border-0"
                >
                    Upgrade to Continue
                </Button>
            </Link>
        </div>
    );
}
