'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Info, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AccountingSettingsProps {
    companyId: string;
    initialSettings?: any;
}

export function AccountingSettingsForm({ companyId, initialSettings }: AccountingSettingsProps) {
    const { toast } = useToast();
    const [mode, setMode] = useState(initialSettings?.settlementValidationMode || 'FLEXIBLE');
    const [settings, setSettings] = useState({
        requirePodUploaded: initialSettings?.requirePodUploaded || false,
        requireReadyForSettlementFlag: initialSettings?.requireReadyForSettlementFlag || false,
        requireDeliveredDate: initialSettings?.requireDeliveredDate || true,
        requireMcNumberMatch: initialSettings?.requireMcNumberMatch || true,
        warnOnMissingPod: initialSettings?.warnOnMissingPod || true,
        warnOnMissingBol: initialSettings?.warnOnMissingBol || true,
        warnOnOldDeliveryDate: initialSettings?.warnOnOldDeliveryDate || true,
        oldDeliveryThresholdDays: initialSettings?.oldDeliveryThresholdDays || 30,
        requirePodForInvoicing: initialSettings?.requirePodForInvoicing || false,
        requireBolForInvoicing: initialSettings?.requireBolForInvoicing || false,
        allowPartialBatches: initialSettings?.allowPartialBatches || true,
        autoMarkReadyForSettlement: initialSettings?.autoMarkReadyForSettlement || false,
        autoMarkReadyForInvoicing: initialSettings?.autoMarkReadyForInvoicing || false,
    });

    const handleModeChange = (newMode: string) => {
        setMode(newMode);

        if (newMode === 'STRICT') {
            setSettings({
                ...settings,
                requirePodUploaded: true,
                requireReadyForSettlementFlag: true,
                requireDeliveredDate: true,
                requireMcNumberMatch: true,
            });
        } else if (newMode === 'FLEXIBLE') {
            setSettings({
                ...settings,
                requirePodUploaded: false,
                requireReadyForSettlementFlag: false,
                requireDeliveredDate: true,
                requireMcNumberMatch: true,
            });
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`/api/companies/${companyId}/accounting-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settlementValidationMode: mode,
                    ...settings,
                }),
            });

            if (!response.ok) throw new Error('Failed to save settings');

            toast({
                title: 'Settings Saved',
                description: 'Accounting settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Validation Mode */}
            <Card>
                <CardHeader>
                    <CardTitle>Settlement Validation Mode</CardTitle>
                    <CardDescription>
                        Choose how strictly loads are validated before settlement generation
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RadioGroup value={mode} onValueChange={handleModeChange}>
                        <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                            <RadioGroupItem value="FLEXIBLE" id="flexible" />
                            <div className="flex-1">
                                <Label htmlFor="flexible" className="font-medium cursor-pointer">
                                    Flexible Mode <Badge variant="secondary" className="ml-2">Recommended</Badge>
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Only requires:</strong> Load status = DELIVERED
                                    <br />
                                    <span className="text-xs">
                                        POD, BOL, and ready flag are optional. Warnings shown but settlement allowed.
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                            <RadioGroupItem value="STRICT" id="strict" />
                            <div className="flex-1">
                                <Label htmlFor="strict" className="font-medium cursor-pointer">
                                    Strict Mode
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Requires:</strong> DELIVERED status + POD uploaded + Ready flag + Delivered date
                                    <br />
                                    <span className="text-xs">
                                        All validations must pass. Loads missing requirements cannot be settled.
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                            <RadioGroupItem value="CUSTOM" id="custom" />
                            <div className="flex-1">
                                <Label htmlFor="custom" className="font-medium cursor-pointer">
                                    Custom Mode
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Configure:</strong> Choose which validations are required
                                    <br />
                                    <span className="text-xs">
                                        Customize validation rules below to match your workflow.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Custom Validation Rules */}
            {mode === 'CUSTOM' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Custom Validation Rules</CardTitle>
                        <CardDescription>
                            Configure which validations are required for settlement generation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                                <div className="space-y-0.5">
                                    <Label className="font-medium">
                                        Delivered Status <Badge variant="destructive" className="ml-2">MANDATORY</Badge>
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Load must be in DELIVERED status (cannot be disabled)
                                    </p>
                                </div>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="requirePod">Require POD Uploaded</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Load must have Proof of Delivery uploaded
                                    </p>
                                </div>
                                <Switch
                                    id="requirePod"
                                    checked={settings.requirePodUploaded}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, requirePodUploaded: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="requireReady">Require "Ready for Settlement" Flag</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Load must be manually marked as ready for settlement
                                    </p>
                                </div>
                                <Switch
                                    id="requireReady"
                                    checked={settings.requireReadyForSettlementFlag}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, requireReadyForSettlementFlag: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="requireDeliveredDate">Require Delivered Date</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Load must have a delivered date set
                                    </p>
                                </div>
                                <Switch
                                    id="requireDeliveredDate"
                                    checked={settings.requireDeliveredDate}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, requireDeliveredDate: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="requireMcMatch">Require MC Number Match</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Load MC must match driver MC (important for multi-MC companies)
                                    </p>
                                </div>
                                <Switch
                                    id="requireMcMatch"
                                    checked={settings.requireMcNumberMatch}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, requireMcNumberMatch: checked })
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warning Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Warning Settings</CardTitle>
                    <CardDescription>
                        Show warnings for missing documents (does not block settlement)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="warnPod">Warn on Missing POD</Label>
                            <p className="text-sm text-muted-foreground">
                                Show warning toast if POD is not uploaded
                            </p>
                        </div>
                        <Switch
                            id="warnPod"
                            checked={settings.warnOnMissingPod}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, warnOnMissingPod: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="warnBol">Warn on Missing BOL</Label>
                            <p className="text-sm text-muted-foreground">
                                Show warning toast if BOL is not uploaded
                            </p>
                        </div>
                        <Switch
                            id="warnBol"
                            checked={settings.warnOnMissingBol}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, warnOnMissingBol: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="warnOld">Warn on Old Delivery Date</Label>
                            <p className="text-sm text-muted-foreground">
                                Show warning if load was delivered more than X days ago
                            </p>
                        </div>
                        <Switch
                            id="warnOld"
                            checked={settings.warnOnOldDeliveryDate}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, warnOnOldDeliveryDate: checked })
                            }
                        />
                    </div>

                    {settings.warnOnOldDeliveryDate && (
                        <div className="ml-6 space-y-2">
                            <Label htmlFor="threshold">Days Threshold</Label>
                            <Input
                                id="threshold"
                                type="number"
                                value={settings.oldDeliveryThresholdDays}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        oldDeliveryThresholdDays: parseInt(e.target.value) || 30,
                                    })
                                }
                                className="w-32"
                            />
                            <p className="text-xs text-muted-foreground">
                                Warn if delivered more than {settings.oldDeliveryThresholdDays} days ago
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Automation Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Automation Settings</CardTitle>
                    <CardDescription>
                        Automatically mark loads as ready when certain conditions are met
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="autoReady">Auto-Mark Ready for Settlement</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically check "Ready for Settlement" when POD is uploaded
                            </p>
                        </div>
                        <Switch
                            id="autoReady"
                            checked={settings.autoMarkReadyForSettlement}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, autoMarkReadyForSettlement: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="autoInvoice">Auto-Mark Ready for Invoicing</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically mark ready for invoicing when load is delivered
                            </p>
                        </div>
                        <Switch
                            id="autoInvoice"
                            checked={settings.autoMarkReadyForInvoicing}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, autoMarkReadyForInvoicing: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Batch Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Batch Processing</CardTitle>
                    <CardDescription>
                        Configure how batches handle loads with validation issues
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="partialBatch">Allow Partial Batches</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow batch creation even if some loads fail validation (invalid loads skipped)
                            </p>
                        </div>
                        <Switch
                            id="partialBatch"
                            checked={settings.allowPartialBatches}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, allowPartialBatches: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} size="lg">
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                </Button>
            </div>
        </div>
    );
}
