'use client';

import { Terminal, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

interface AlignmentLog {
    type: 'match' | 'info' | 'success' | 'warning';
    message: string;
    timestamp: string;
}

interface DataAlignmentConsoleProps {
    columnMapping: Record<string, string>;
    isMapping: boolean;
    systemFields: Array<{ key: string; label: string }>;
    excelColumns: string[];
}

export function DataAlignmentConsole({
    columnMapping,
    isMapping,
    systemFields,
    excelColumns,
}: DataAlignmentConsoleProps) {
    const [logs, setLogs] = useState<AlignmentLog[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isMapping) {
            setLogs([{
                type: 'info',
                message: 'Awaiting AI semantic analysis of file structure...',
                timestamp: new Date().toLocaleTimeString(),
            }]);
        }
    }, [isMapping]);

    useEffect(() => {
        if (Object.keys(columnMapping).length > 0) {
            const newLogs: AlignmentLog[] = [];

            Object.entries(columnMapping).forEach(([csv, systemKey]) => {
                const field = systemFields.find(f => f.key === systemKey);
                newLogs.push({
                    type: 'match',
                    message: `Aligned: CSV "${csv}" -> System "${field?.label || systemKey}"`,
                    timestamp: new Date().toLocaleTimeString(),
                });
            });

            if (!isMapping) {
                newLogs.push({
                    type: 'success',
                    message: `Mapping complete. ${Object.keys(columnMapping).length} fields synchronized.`,
                    timestamp: new Date().toLocaleTimeString(),
                });
            }

            setLogs(newLogs);
        }
    }, [columnMapping, isMapping, systemFields]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="mt-4 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between bg-zinc-900 px-3 py-2 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal className="h-3 w-3" />
                    <span>Data Alignment Console</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-zinc-700" />
                    <div className="h-2 w-2 rounded-full bg-zinc-700" />
                    <div className="h-2 w-2 rounded-full bg-zinc-700" />
                </div>
            </div>
            <div
                ref={scrollRef}
                className="p-3 h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800"
            >
                {logs.map((log, i) => (
                    <div key={i} className={cn(
                        "flex gap-2 animate-in fade-in slide-in-from-left-1",
                        log.type === 'match' && "text-indigo-400",
                        log.type === 'success' && "text-emerald-400",
                        log.type === 'info' && "text-zinc-500",
                        log.type === 'warning' && "text-amber-400"
                    )}>
                        <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                        <span className="shrink-0">
                            {log.type === 'success' && <CheckCircle2 className="h-3 w-3 mt-0.5" />}
                            {log.type === 'match' && <span className="text-indigo-600">»</span>}
                            {log.type === 'info' && <Info className="h-3 w-3 mt-0.5" />}
                            {log.type === 'warning' && <span className="text-amber-500">!</span>}
                        </span>
                        <span className="break-all">{log.message}</span>
                    </div>
                ))}
                {isMapping && (
                    <div className="flex gap-2 text-indigo-400 animate-pulse">
                        <span className="text-zinc-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                        <Loader2 className="h-3 w-3 mt-0.5 animate-spin" />
                        <span>Processing AI heuristics...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
