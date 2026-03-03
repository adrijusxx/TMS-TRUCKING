'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * HOS limits per FMCSA regulations:
 * - 11 hours max driving in a 14-hour window
 * - 70 hours max on-duty in 8 days
 */
const MAX_DAILY_DRIVE_HOURS = 11;

export interface HOSData {
  driveTime: number; // hours driven today
  onDutyTime: number; // on-duty hours today
  weeklyDriveTime: number; // 8-day rolling drive time
  weeklyOnDuty: number; // 8-day rolling on-duty time
  hasViolation?: boolean;
}

type HOSLevel = 'green' | 'yellow' | 'red';

function getHOSLevel(data: HOSData | null | undefined): {
  level: HOSLevel;
  hoursRemaining: number;
  label: string;
} {
  if (!data) {
    return { level: 'green', hoursRemaining: MAX_DAILY_DRIVE_HOURS, label: 'No HOS data' };
  }

  if (data.hasViolation) {
    return { level: 'red', hoursRemaining: 0, label: 'HOS Violation' };
  }

  const dailyRemaining = Math.max(0, MAX_DAILY_DRIVE_HOURS - data.driveTime);
  const weeklyRemaining = Math.max(0, 70 - data.weeklyOnDuty);
  const hoursRemaining = Math.min(dailyRemaining, weeklyRemaining);

  if (hoursRemaining < 1) {
    return { level: 'red', hoursRemaining, label: `${hoursRemaining.toFixed(1)}h remaining` };
  }
  if (hoursRemaining <= 3) {
    return { level: 'yellow', hoursRemaining, label: `${hoursRemaining.toFixed(1)}h remaining` };
  }
  return { level: 'green', hoursRemaining, label: `${hoursRemaining.toFixed(1)}h remaining` };
}

const levelStyles: Record<HOSLevel, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500 animate-pulse',
};

interface DriverHOSBadgeProps {
  hosData: HOSData | null | undefined;
  className?: string;
}

export default function DriverHOSBadge({ hosData, className }: DriverHOSBadgeProps) {
  const { level, hoursRemaining, label } = getHOSLevel(hosData);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-block h-2.5 w-2.5 rounded-full shrink-0 cursor-help',
              levelStyles[level],
              className
            )}
            aria-label={`HOS: ${label}`}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">HOS Status</p>
            <p>{label}</p>
            {hosData && (
              <>
                <p>Daily drive: {hosData.driveTime.toFixed(1)}h / {MAX_DAILY_DRIVE_HOURS}h</p>
                <p>Weekly on-duty: {hosData.weeklyOnDuty.toFixed(1)}h / 70h</p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
