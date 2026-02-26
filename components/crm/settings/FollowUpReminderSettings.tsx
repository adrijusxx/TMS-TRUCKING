'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Bell } from 'lucide-react';

export default function FollowUpReminderSettings() {
    const queryClient = useQueryClient();
    const [enabled, setEnabled] = useState(true);
    const [reminderHoursBefore, setReminderHoursBefore] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['crm-general-settings'],
        queryFn: async () => {
            const res = await fetch('/api/crm/settings/general');
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
    });

    useEffect(() => {
        if (data?.crm?.followUpReminders) {
            setEnabled(data.crm.followUpReminders.enabled ?? true);
            setReminderHoursBefore(data.crm.followUpReminders.reminderHoursBefore ?? 1);
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/crm/settings/general', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crm: { followUpReminders: { enabled, reminderHoursBefore } },
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Follow-up reminder settings saved');
            queryClient.invalidateQueries({ queryKey: ['crm-general-settings'] });
        },
        onError: () => toast.error('Failed to save settings'),
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
                    <Bell className="h-5 w-5" />
                    Follow-Up Reminders
                </CardTitle>
                <CardDescription>
                    Notify recruiters when a lead follow-up date is approaching or overdue.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-medium">Enable Reminders</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Send in-app notifications for upcoming and overdue follow-ups.
                        </p>
                    </div>
                    <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
                {enabled && (
                    <div className="flex items-center gap-3">
                        <Label className="text-sm whitespace-nowrap">Remind</Label>
                        <Input
                            type="number"
                            min={1}
                            max={48}
                            value={reminderHoursBefore}
                            onChange={(e) => setReminderHoursBefore(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">hours before follow-up date</span>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Reminder Settings
                </Button>
            </CardFooter>
        </Card>
    );
}
