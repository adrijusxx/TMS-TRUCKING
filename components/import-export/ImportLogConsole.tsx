'use client';

import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ImportProgress } from '@/lib/hooks/useImportWizard';
import type { RefObject } from 'react';

interface ImportLogConsoleProps {
  importProgress: ImportProgress;
  logs: string[];
  logsEndRef: RefObject<HTMLDivElement | null>;
  visible: boolean;
}

export function ImportLogConsole({ importProgress, logs, logsEndRef, visible }: ImportLogConsoleProps) {
  if (!visible) return null;

  return (
    <div className="border-t shadow-lg flex flex-col max-h-[200px] shrink-0">
      <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
        <span className="text-xs font-semibold flex items-center gap-2">
          {importProgress.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
          {importProgress.message}
        </span>
        <span className="text-xs font-mono">{importProgress.progress}%</span>
      </div>
      <Progress value={importProgress.progress} className="h-1 rounded-none" />
      <div className="flex-1 p-4 overflow-y-auto bg-black text-green-400 font-mono text-xs space-y-1 h-32">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
