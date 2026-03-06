'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';

interface MattermostSettings {
    autoCreateCases: boolean;
    aiAutoResponse: boolean;
    requireStaffApproval: boolean;
    businessHoursOnly: boolean;
    businessHoursStart?: string;
    businessHoursEnd?: string;
    timezone: string;
}

const TIMEZONES = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
];

interface Props {
    settings: MattermostSettings;
    onToggle: (field: string, value: boolean) => void;
    onUpdate: (data: Partial<MattermostSettings>) => void;
}

export default function MattermostGeneralSettings({ settings, onToggle, onUpdate }: Props) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    General Settings
                </CardTitle>
                <CardDescription className="text-xs">Core feature toggles and business hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ToggleRow
                    label="Auto-Create Cases"
                    description="Automatically create Breakdown, Safety, and Maintenance cases when AI detects driver issues"
                    checked={settings.autoCreateCases}
                    onChange={v => onToggle('autoCreateCases', v)}
                />
                <Separator />
                <ToggleRow
                    label="AI Auto-Response"
                    description="Let AI automatically respond to driver messages via Mattermost"
                    checked={settings.aiAutoResponse}
                    onChange={v => onToggle('aiAutoResponse', v)}
                />
                <Separator />
                <ToggleRow
                    label="Require Staff Approval"
                    description="Cases go to review queue instead of auto-creating. AI responses require staff approval."
                    checked={settings.requireStaffApproval}
                    onChange={v => onToggle('requireStaffApproval', v)}
                />
                <Separator />
                <ToggleRow
                    label="Business Hours Only"
                    description="Only auto-respond during business hours. After-hours template sent outside hours."
                    checked={settings.businessHoursOnly}
                    onChange={v => onToggle('businessHoursOnly', v)}
                />
                {settings.businessHoursOnly && (
                    <div className="grid grid-cols-3 gap-3 ml-6">
                        <div className="space-y-1">
                            <Label className="text-[10px]">Start</Label>
                            <Input
                                type="time"
                                value={settings.businessHoursStart || '09:00'}
                                onChange={e => onUpdate({ businessHoursStart: e.target.value })}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px]">End</Label>
                            <Input
                                type="time"
                                value={settings.businessHoursEnd || '17:00'}
                                onChange={e => onUpdate({ businessHoursEnd: e.target.value })}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px]">Timezone</Label>
                            <Select
                                value={settings.timezone || 'America/Chicago'}
                                onValueChange={v => onUpdate({ timezone: v })}
                            >
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {TIMEZONES.map(tz => (
                                        <SelectItem key={tz} value={tz} className="text-xs">
                                            {tz.replace('America/', '').replace('Pacific/', '').replace(/_/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ToggleRow({ label, description, checked, onChange }: {
    label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
                <Label className="text-sm">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}
