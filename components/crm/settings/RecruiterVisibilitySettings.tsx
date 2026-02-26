'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, Loader2 } from 'lucide-react';

export default function RecruiterVisibilitySettings() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['crm-general-settings'],
        queryFn: async () => {
            const res = await fetch('/api/crm/settings/general');
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
    });

    const mutation = useMutation({
        mutationFn: async (recruiterSeeOnlyOwnLeads: boolean) => {
            const res = await fetch('/api/crm/settings/general', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crm: { recruiterSeeOnlyOwnLeads } }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Visibility setting saved');
            queryClient.invalidateQueries({ queryKey: ['crm-general-settings'] });
        },
        onError: () => toast.error('Failed to save visibility setting'),
    });

    const enabled = data?.crm?.recruiterSeeOnlyOwnLeads === true;

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
                    <Eye className="h-5 w-5" />
                    Lead Visibility
                </CardTitle>
                <CardDescription>
                    Control whether recruiters can see all leads or only leads assigned to them.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-medium">
                            Recruiters see only their assigned leads
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            When enabled, non-admin recruiters will only see leads assigned to them
                            or created by them. Admins always see all leads.
                        </p>
                    </div>
                    <Switch
                        checked={enabled}
                        onCheckedChange={(v) => mutation.mutate(v)}
                        disabled={mutation.isPending}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
