'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ImportPreviewStepProps {
    previewData: any[];
    importResult: any;
    importMutation: any;
    importStatus: string;
    importProgress: number;
    errorLog: any[];
    successCount: number;
    onImport: () => void;
    onComplete?: () => void;
    backUrl?: string;
    router: any;
    entityLabel: string;
    deduplicatedFields: any[];
    columnMapping: Record<string, string>;
}

export function ImportPreviewStep({
    previewData,
    importResult,
    importMutation,
    importStatus,
    importProgress,
    errorLog,
    successCount,
    onImport,
    onComplete,
    backUrl,
    router,
    entityLabel,
    deduplicatedFields,
    columnMapping,
}: ImportPreviewStepProps) {
    const handleContinue = () => {
        if (onComplete) {
            onComplete();
        } else if (backUrl) {
            router.push(backUrl);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Preview Data</h2>
                <div className="space-x-2">
                    {errorLog.length > 0 ? (
                        <Button onClick={handleContinue}>
                            Continue Anyway
                        </Button>
                    ) : (
                        <Button onClick={onImport} disabled={importMutation.isPending || importMutation.isSuccess}>
                            {importMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                'Run Import'
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* IMPORT STATUS / PROGRESS */}
            {(importMutation.isPending || importStatus) && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>{importStatus}</span>
                        <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                </div>
            )}

            {/* ERROR LOG / RESULTS SUMMARY */}
            {errorLog.length > 0 ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-green-50 border-green-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-green-700 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Success
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-800">{successCount}</div>
                                <p className="text-xs text-green-600">Records created successfully</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-red-700 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Failed
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-800">{errorLog.length}</div>
                                <p className="text-xs text-red-600">Rows skipped due to errors</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-800 text-lg">Error Log</CardTitle>
                            <CardDescription>The following rows could not be imported. Please fix the file and re-import these rows.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted sticky top-0">
                                        <tr>
                                            <th className="p-2 text-left w-[80px]">Row #</th>
                                            <th className="p-2 text-left">Error Message</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {errorLog.map((err, idx) => (
                                            <tr key={idx} className="hover:bg-muted/50">
                                                <td className="p-2 font-mono text-xs text-muted-foreground">{err.row}</td>
                                                <td className="p-2 text-red-600 font-medium">{err.error}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                !importStatus.includes('Completed') && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <span>Mapped Columns: {Object.keys(columnMapping).length}</span>
                            <span>Total Rows: {importResult?.data?.length || 0}</span>
                        </div>

                        <div className="border rounded-lg overflow-hidden overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted">
                                    <tr>
                                        {deduplicatedFields.map((field) => (
                                            <th key={field.key} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                {field.label}
                                                {columnMapping && Object.values(columnMapping).includes(field.key) ? (
                                                    <span className="ml-1 text-green-600 font-normal" title="Mapped">●</span>
                                                ) : null}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {previewData.map((row, i) => (
                                        <tr key={i}>
                                            {deduplicatedFields.map((field) => (
                                                <td key={`${i}-${field.key}`} className="px-4 py-3 text-sm whitespace-nowrap">
                                                    {row[field.key] != null && row[field.key] !== '' ? String(row[field.key]) : '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
