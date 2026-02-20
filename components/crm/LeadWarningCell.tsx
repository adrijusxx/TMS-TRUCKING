'use client';

import { AlertTriangle, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LeadWarning, WarningSeverity } from '@/lib/utils/lead-warnings';

interface LeadWarningCellProps {
    warnings: LeadWarning[];
}

const severityConfig: Record<WarningSeverity, { icon: typeof AlertTriangle; color: string; dot: string }> = {
    critical: { icon: AlertTriangle, color: 'text-red-500', dot: 'bg-red-500 animate-pulse' },
    warning: { icon: AlertCircle, color: 'text-amber-500', dot: 'bg-amber-500' },
    info: { icon: Clock, color: 'text-blue-500', dot: 'bg-blue-500' },
};

export default function LeadWarningCell({ warnings }: LeadWarningCellProps) {
    if (warnings.length === 0) {
        return (
            <div className="flex items-center gap-1.5 text-muted-foreground/40">
                <CheckCircle className="h-3.5 w-3.5" />
            </div>
        );
    }

    const top = warnings[0];
    const config = severityConfig[top.severity];
    const Icon = config.icon;

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 max-w-[140px]">
                        <span className={cn('h-2 w-2 rounded-full flex-shrink-0', config.dot)} />
                        <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', config.color)} />
                        <span className={cn('text-xs truncate', config.color)}>
                            {top.message}
                        </span>
                        {warnings.length > 1 && (
                            <span className="text-[10px] text-muted-foreground">
                                +{warnings.length - 1}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px]">
                    <div className="space-y-1.5">
                        {warnings.map((w, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className={cn(
                                    'h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0',
                                    severityConfig[w.severity].dot.replace(' animate-pulse', '')
                                )} />
                                <div>
                                    <p className="text-xs font-medium">{w.message}</p>
                                    {w.detail && (
                                        <p className="text-[10px] text-muted-foreground">{w.detail}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
