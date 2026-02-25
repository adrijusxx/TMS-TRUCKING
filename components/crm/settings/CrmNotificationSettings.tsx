'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, BellRing } from 'lucide-react';

interface NotificationConfig {
    notifyOnAssignment: boolean;
    notifyOnFollowUpOverdue: boolean;
    notifyOnSLABreach: boolean;
    notifyOnNewApplication: boolean;
    emailNotifications: boolean;
}

const DEFAULTS: NotificationConfig = {
    notifyOnAssignment: true,
    notifyOnFollowUpOverdue: true,
    notifyOnSLABreach: true,
    notifyOnNewApplication: true,
    emailNotifications: false,
};

const NOTIFICATION_ITEMS: { key: keyof NotificationConfig; label: string; description: string }[] = [
    {
        key: 'notifyOnAssignment',
        label: 'Lead Assigned',
        description: 'Notify recruiter when a lead is assigned to them',
    },
    {
        key: 'notifyOnFollowUpOverdue',
        label: 'Follow-Up Overdue',
        description: 'Notify when a lead follow-up date has passed',
    },
    {
        key: 'notifyOnSLABreach',
        label: 'SLA Breach',
        description: 'Notify when a lead exceeds its pipeline SLA threshold',
    },
    {
        key: 'notifyOnNewApplication',
        label: 'New Application',
        description: 'Notify when a new lead is created from an application form',
    },
    {
        key: 'emailNotifications',
        label: 'Email Notifications',
        description: 'Send email in addition to in-app notifications',
    },
];

export default function CrmNotificationSettings() {
    const queryClient = useQueryClient();
    const [config, setConfig] = useState<NotificationConfig>(DEFAULTS);

    const { data, isLoading } = useQuery({
        queryKey: ['crm-general-settings'],
        queryFn: async () => {
            const res = await fetch('/api/crm/settings/general');
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
    });

    useEffect(() => {
        if (data?.notifications) {
            setConfig({ ...DEFAULTS, ...data.notifications });
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/crm/settings/general', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notifications: config }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Notification settings saved');
            queryClient.invalidateQueries({ queryKey: ['crm-general-settings'] });
        },
        onError: () => toast.error('Failed to save notification settings'),
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5" />
                    CRM Notifications
                </CardTitle>
                <CardDescription>
                    Control which CRM events trigger notifications for your team.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {NOTIFICATION_ITEMS.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                        <div>
                            <Label className="text-sm font-medium">{item.label}</Label>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch
                            checked={config[item.key]}
                            onCheckedChange={(v) => setConfig((c) => ({ ...c, [item.key]: v }))}
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Notification Settings
                </Button>
            </CardFooter>
        </Card>
    );
}
