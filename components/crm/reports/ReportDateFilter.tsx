'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Calendar } from 'lucide-react';

interface ReportDateFilterProps {
    from: string;
    to: string;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
    onExportCsv?: () => void;
}

const PRESETS = [
    { label: 'This Month', getValue: () => ({ from: startOfMonth(), to: today() }) },
    { label: 'Last 30d', getValue: () => ({ from: daysAgo(30), to: today() }) },
    { label: 'Last 90d', getValue: () => ({ from: daysAgo(90), to: today() }) },
    { label: 'This Year', getValue: () => ({ from: startOfYear(), to: today() }) },
    { label: 'All Time', getValue: () => ({ from: '', to: '' }) },
];

function today() {
    return new Date().toISOString().split('T')[0];
}
function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}
function startOfMonth() {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
}
function startOfYear() {
    return `${new Date().getFullYear()}-01-01`;
}

export default function ReportDateFilter({ from, to, onFromChange, onToChange, onExportCsv }: ReportDateFilterProps) {
    const [showPresets, setShowPresets] = useState(false);

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPresets(!showPresets)}
                    className="gap-1.5"
                >
                    <Calendar className="h-3.5 w-3.5" />
                    Quick
                </Button>
                {showPresets && (
                    <div className="absolute top-full left-0 z-50 mt-1 bg-popover border rounded-md shadow-md p-1 min-w-[140px]">
                        {PRESETS.map((p) => (
                            <button
                                key={p.label}
                                className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted transition-colors"
                                onClick={() => {
                                    const val = p.getValue();
                                    onFromChange(val.from);
                                    onToChange(val.to);
                                    setShowPresets(false);
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Input
                type="date"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
                className="w-36 h-8 text-sm"
                placeholder="From"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
                type="date"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                className="w-36 h-8 text-sm"
                placeholder="To"
            />

            {from || to ? (
                <Button variant="ghost" size="sm" onClick={() => { onFromChange(''); onToChange(''); }}>
                    Clear
                </Button>
            ) : null}

            {onExportCsv && (
                <Button variant="outline" size="sm" onClick={onExportCsv} className="gap-1.5 ml-auto">
                    <Download className="h-3.5 w-3.5" />
                    CSV
                </Button>
            )}
        </div>
    );
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
