'use client';

import { useState, useEffect, useRef } from 'react';
import { McNumber, CrmIntegration } from '@prisma/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Save, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { normalizeCrmConfig, getSelectedSheets, getTotalImportedRows } from '@/lib/utils/crm-config';
import { SheetTabSelector } from './SheetTabSelector';

interface CrmSettingsListProps {
    mcNumbers: (McNumber & { crmIntegrations: CrmIntegration[] })[];
}

interface FormData {
    enabled: boolean;
    sheetId: string;
    selectedSheets: string[];
    syncInterval: number;
}

const SYNC_INTERVALS = [
    { label: 'Manual only', value: 0 },
    { label: 'Every 15 minutes', value: 15 },
    { label: 'Every 30 minutes', value: 30 },
    { label: 'Every hour', value: 60 },
    { label: 'Every 6 hours', value: 360 },
    { label: 'Every 24 hours', value: 1440 },
];

export default function CrmSettingsList({ mcNumbers }: CrmSettingsListProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [resetting, setResetting] = useState<string | null>(null);
    const [tabsLoading, setTabsLoading] = useState<Record<string, boolean>>({});
    const [availableTabs, setAvailableTabs] = useState<Record<string, string[]>>({});

    const [formData, setFormData] = useState<Record<string, FormData>>(() => {
        const initial: Record<string, FormData> = {};
        mcNumbers.forEach(mc => {
            const integration = mc.crmIntegrations.find(i => i.type === 'GOOGLE_SHEETS');
            const rawConfig = (integration?.config as Record<string, any>) || {};
            const normalized = normalizeCrmConfig(rawConfig);
            initial[mc.id] = {
                enabled: integration?.enabled ?? false,
                sheetId: normalized.sheetId,
                selectedSheets: getSelectedSheets(normalized),
                syncInterval: integration?.syncInterval ?? 15,
            };
        });
        return initial;
    });

    // Debounced auto-fetch of tabs when sheetId changes
    const sheetIdMap = Object.fromEntries(
        Object.entries(formData).map(([mcId, data]) => [mcId, data.sheetId])
    );
    const debouncedSheetIds = useDebounce(JSON.stringify(sheetIdMap), 600);
    const prevDebouncedRef = useRef(debouncedSheetIds);

    useEffect(() => {
        if (debouncedSheetIds === prevDebouncedRef.current) return;
        prevDebouncedRef.current = debouncedSheetIds;

        const parsed = JSON.parse(debouncedSheetIds) as Record<string, string>;
        for (const [mcId, sheetId] of Object.entries(parsed)) {
            const trimmed = sheetId?.trim();
            if (trimmed && trimmed.length > 10 && formData[mcId]?.enabled) {
                fetchTabs(mcId, trimmed);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSheetIds]);

    function updateField<K extends keyof FormData>(mcId: string, key: K, value: FormData[K]) {
        setFormData(prev => ({ ...prev, [mcId]: { ...prev[mcId], [key]: value } }));
        if (key === 'sheetId') {
            setAvailableTabs(prev => ({ ...prev, [mcId]: [] }));
        }
    }

    async function fetchTabs(mcId: string, sheetId?: string) {
        const id = sheetId || formData[mcId]?.sheetId?.trim();
        if (!id) return;
        setTabsLoading(prev => ({ ...prev, [mcId]: true }));
        try {
            const res = await fetch(`/api/crm/integrations/google-sheets/tabs?sheetId=${encodeURIComponent(id)}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setAvailableTabs(prev => ({ ...prev, [mcId]: json.tabs }));
            // Auto-select all tabs if none were selected
            if (formData[mcId].selectedSheets.length === 0 && json.tabs.length > 0) {
                updateField(mcId, 'selectedSheets', json.tabs);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to load sheet tabs');
        } finally {
            setTabsLoading(prev => ({ ...prev, [mcId]: false }));
        }
    }

    const handleSave = async (mcId: string) => {
        const data = formData[mcId];
        if (data.enabled && !data.sheetId.trim()) {
            toast.error('Please enter a Google Sheet ID');
            return;
        }
        if (data.enabled && data.selectedSheets.length === 0) {
            toast.error('Please select at least one sheet tab');
            return;
        }
        setLoading(mcId);
        try {
            // Preserve existing per-sheet progress
            const integration = mcNumbers.find(m => m.id === mcId)
                ?.crmIntegrations.find(i => i.type === 'GOOGLE_SHEETS');
            const existingConfig = normalizeCrmConfig((integration?.config as Record<string, any>) || {});

            const sheets: Record<string, { lastImportedRow: number; columnMapping: Record<string, string> | null }> = {};
            for (const name of data.selectedSheets) {
                const existing = existingConfig.sheets[name];
                sheets[name] = {
                    lastImportedRow: existing?.lastImportedRow || 0,
                    columnMapping: existing?.columnMapping || null,
                };
            }

            const res = await fetch('/api/crm/integrations/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mcNumberId: mcId,
                    type: 'GOOGLE_SHEETS',
                    enabled: data.enabled,
                    syncInterval: data.syncInterval || null,
                    config: { sheetId: data.sheetId.trim(), sheets },
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }
            toast.success('Settings saved');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Error saving settings');
        } finally {
            setLoading(null);
        }
    };

    const handleSync = async (integrationId: string | undefined) => {
        if (!integrationId) {
            toast.error('Save settings first before syncing');
            return;
        }
        setSyncing(integrationId);
        try {
            const res = await fetch('/api/crm/integrations/google-sheets/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integrationId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Sync failed');

            const { created, duplicates, errors } = json.data;
            if (created > 0) {
                toast.success(`Sync complete — ${created} new lead${created !== 1 ? 's' : ''} imported`);
            } else if (duplicates > 0) {
                toast.info(`No new leads — ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped`);
            } else {
                toast.info('Sync complete — no new rows found');
            }
            if (errors?.length > 0) {
                toast.warning(`${errors.length} row${errors.length !== 1 ? 's' : ''} had errors`);
            }
            router.refresh();
        } catch (error: any) {
            toast.error(`Sync failed: ${error.message}`);
        } finally {
            setSyncing(null);
        }
    };

    const handleResetProgress = async (mcId: string, integrationId: string | undefined) => {
        if (!integrationId) return;
        if (!confirm('Reset sync progress? Next sync will re-import all rows from the beginning (duplicates will be skipped).')) return;

        setResetting(mcId);
        try {
            const data = formData[mcId];
            const sheets: Record<string, { lastImportedRow: number; columnMapping: null }> = {};
            for (const name of data.selectedSheets) {
                sheets[name] = { lastImportedRow: 0, columnMapping: null };
            }

            const res = await fetch('/api/crm/integrations/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mcNumberId: mcId,
                    type: 'GOOGLE_SHEETS',
                    enabled: data.enabled,
                    syncInterval: data.syncInterval || null,
                    config: { sheetId: data.sheetId.trim(), sheets },
                }),
            });
            if (!res.ok) throw new Error('Failed to reset');
            toast.success('Sync progress reset — next sync starts from row 1');
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || 'Reset failed');
        } finally {
            setResetting(null);
        }
    };

    return (
        <div className="grid gap-6">
            {mcNumbers.map((mc) => {
                const integration = mc.crmIntegrations.find(i => i.type === 'GOOGLE_SHEETS');
                const rawConfig = (integration?.config as Record<string, any>) || {};
                const normalizedConfig = normalizeCrmConfig(rawConfig);
                const data = formData[mc.id] || { enabled: false, sheetId: '', selectedSheets: [], syncInterval: 15 };
                const tabs = availableTabs[mc.id] || [];
                const isTabsLoading = tabsLoading[mc.id] || false;
                const totalRows = getTotalImportedRows(normalizedConfig);

                return (
                    <Card key={mc.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    MC-{mc.number} — Google Sheets
                                    {integration?.enabled && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">Active</Badge>
                                    )}
                                </span>
                                {integration?.lastSyncAt && (
                                    <span className="text-xs font-normal text-muted-foreground">
                                        Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                                    </span>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Automatically import leads from Google Sheet tabs into this MC number's pipeline.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Enable toggle */}
                            <div className="flex items-center gap-3">
                                <Switch
                                    id={`enable-${mc.id}`}
                                    checked={data.enabled}
                                    onCheckedChange={(checked) => updateField(mc.id, 'enabled', checked)}
                                />
                                <Label htmlFor={`enable-${mc.id}`} className="font-medium">
                                    Enable auto-import
                                </Label>
                            </div>

                            {/* Sheet ID */}
                            <div className="space-y-2">
                                <Label htmlFor={`sheet-${mc.id}`}>Google Sheet ID or URL</Label>
                                <Input
                                    id={`sheet-${mc.id}`}
                                    placeholder="Paste Sheet URL or ID..."
                                    value={data.sheetId}
                                    onChange={(e) => updateField(mc.id, 'sheetId', e.target.value)}
                                    disabled={!data.enabled}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Paste the full URL or just the ID from the spreadsheet address bar.
                                </p>
                            </div>

                            {/* Sheet tab multi-selector */}
                            <div className="space-y-2">
                                <Label>Sheet Tabs</Label>
                                <SheetTabSelector
                                    availableTabs={tabs}
                                    selectedTabs={data.selectedSheets}
                                    onSelectionChange={(sheets) => updateField(mc.id, 'selectedSheets', sheets)}
                                    isLoading={isTabsLoading}
                                    disabled={!data.enabled}
                                    onLoadTabs={() => fetchTabs(mc.id)}
                                    perSheetProgress={normalizedConfig.sheets}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Select one or more tabs to import leads from. Tabs auto-load when you enter a Sheet ID.
                                </p>
                            </div>

                            {/* Auto-sync interval */}
                            <div className="space-y-2">
                                <Label>Auto-sync interval</Label>
                                <Select
                                    value={String(data.syncInterval)}
                                    onValueChange={(v) => updateField(mc.id, 'syncInterval', parseInt(v))}
                                    disabled={!data.enabled}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SYNC_INTERVALS.map((opt) => (
                                            <SelectItem key={opt.value} value={String(opt.value)}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    How often to automatically check for new rows in the sheet.
                                </p>
                            </div>

                            {/* Sync progress info */}
                            {integration && totalRows > 0 && (
                                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                                    <span className="text-muted-foreground">
                                        Progress: <span className="font-medium text-foreground">{totalRows} row{totalRows !== 1 ? 's' : ''}</span> already imported
                                        {data.selectedSheets.length > 1 && (
                                            <span className="ml-1">across {data.selectedSheets.length} sheets</span>
                                        )}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-destructive hover:text-destructive"
                                        onClick={() => handleResetProgress(mc.id, integration?.id)}
                                        disabled={!!resetting}
                                    >
                                        {resetting === mc.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                            <RotateCcw className="h-3 w-3 mr-1" />
                                        )}
                                        Reset progress
                                    </Button>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSync(integration?.id)}
                                disabled={!integration || !!syncing || !data.sheetId.trim()}
                            >
                                {syncing === integration?.id ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
                                ) : (
                                    <><RefreshCw className="mr-2 h-4 w-4" /> Sync Now</>
                                )}
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => handleSave(mc.id)}
                                disabled={!!loading}
                            >
                                {loading === mc.id ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}

            {mcNumbers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                    No MC numbers configured. Add MC numbers in company settings first.
                </div>
            )}
        </div>
    );
}
