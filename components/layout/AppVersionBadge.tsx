'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function AppVersionBadge({ collapsed }: { collapsed?: boolean }) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
  const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA_SHORT || '???';
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;

  const buildDate = buildTimestamp
    ? new Date(buildTimestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-[10px] text-muted-foreground/50 text-center py-1 cursor-default select-none">
            {collapsed ? `v${version}` : `v${version} (${commitSha})`}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">v{version} ({commitSha})</p>
          <p className="text-xs text-muted-foreground">Built: {buildDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
