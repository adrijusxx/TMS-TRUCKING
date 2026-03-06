'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hash, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface Channel {
    id: string;
    name: string;
    display_name: string;
    type: string;
}

interface Props {
    settings: {
        notificationChannelId?: string;
        dispatchChannelId?: string;
        safetyChannelId?: string;
        maintenanceChannelId?: string;
        accountingChannelId?: string;
        fleetChannelId?: string;
    };
    onUpdate: (data: Record<string, any>) => void;
}

const CHANNEL_CATEGORIES = [
    { field: 'dispatchChannelId', label: 'Dispatch', description: 'Load assignments, status changes, geofence arrivals, detention' },
    { field: 'safetyChannelId', label: 'Safety', description: 'HOS violations, document expiry, compliance alerts' },
    { field: 'maintenanceChannelId', label: 'Maintenance', description: 'Breakdowns, engine fault codes, SLA alerts' },
    { field: 'accountingChannelId', label: 'Accounting', description: 'Settlements, invoices, billing holds, fuel theft' },
    { field: 'fleetChannelId', label: 'Fleet', description: 'Dormant equipment, idle drivers' },
    { field: 'notificationChannelId', label: 'Default (Fallback)', description: 'Used when a category channel is not set' },
] as const;

export default function MattermostChannelSettings({ settings, onUpdate }: Props) {
    const { data: channelsData, isLoading } = useQuery({
        queryKey: ['mattermost-channels'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/mattermost/channels'));
            if (!res.ok) return { data: [] };
            return res.json();
        },
    });

    const channels: Channel[] = (channelsData?.data || []).filter(
        (ch: Channel) => ch.type === 'O' || ch.type === 'P'
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Channel Routing
                </CardTitle>
                <CardDescription className="text-xs">
                    Route automated alerts to specific channels. If a category channel is not set, the default fallback channel is used.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading channels...
                    </div>
                ) : channels.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4">
                        No channels found. Make sure Mattermost is connected and a team is configured.
                    </p>
                ) : (
                    CHANNEL_CATEGORIES.map(({ field, label, description }) => (
                        <div key={field} className="space-y-1">
                            <Label className="text-sm">{label}</Label>
                            <p className="text-[10px] text-muted-foreground">{description}</p>
                            <Select
                                value={(settings as any)[field] || '__none__'}
                                onValueChange={v => onUpdate({ [field]: v === '__none__' ? null : v })}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Not configured" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__" className="text-xs text-muted-foreground">
                                        Not configured
                                    </SelectItem>
                                    {channels.map(ch => (
                                        <SelectItem key={ch.id} value={ch.id} className="text-xs">
                                            #{ch.display_name || ch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
