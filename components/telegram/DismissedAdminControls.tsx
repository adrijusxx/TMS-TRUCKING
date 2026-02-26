'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface Props {
    dismissedCount: number;
    onDeleted: () => void;
}

export default function DismissedAdminControls({ dismissedCount, onDeleted }: Props) {
    const queryClient = useQueryClient();

    const { data: settingsData } = useQuery({
        queryKey: ['telegram-review-cleanup-settings'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/telegram/review-queue/settings'));
            if (!res.ok) return { dismissedAutoCleanupDays: 0 };
            const json = await res.json();
            return json.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(apiUrl('/api/telegram/review-queue/dismissed'), { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(`Deleted ${data.data?.deleted || 0} dismissed items`);
            queryClient.invalidateQueries({ queryKey: ['telegram-review-queue'] });
            onDeleted();
        },
        onError: () => toast.error('Failed to delete dismissed items'),
    });

    const settingsMutation = useMutation({
        mutationFn: async (days: number) => {
            const res = await fetch(apiUrl('/api/telegram/review-queue/settings'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dismissedAutoCleanupDays: days }),
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Auto-cleanup setting saved');
            queryClient.invalidateQueries({ queryKey: ['telegram-review-cleanup-settings'] });
        },
        onError: () => toast.error('Failed to save setting'),
    });

    const currentDays = settingsData?.dismissedAutoCleanupDays || 0;

    return (
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" disabled={dismissedCount === 0}>
                        <Trash2 className="h-3 w-3" />
                        Delete All ({dismissedCount})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete all dismissed items?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {dismissedCount} dismissed review item{dismissedCount !== 1 ? 's' : ''}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-1.5 ml-auto">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Auto-delete after:</span>
                <Select
                    value={String(currentDays)}
                    onValueChange={(v) => settingsMutation.mutate(Number(v))}
                    disabled={settingsMutation.isPending}
                >
                    <SelectTrigger className="h-7 w-[100px] text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">Never</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
