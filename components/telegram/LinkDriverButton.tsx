'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UserPlus, UserCheck, X, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface LinkDriverButtonProps {
    chatId: string;
    chatTitle: string;
    chatPhone?: string;
}

interface DriverOption {
    id: string;
    driverNumber: string;
    firstName: string;
    lastName: string;
    truckNumber?: string;
}

export default function LinkDriverButton({ chatId, chatTitle, chatPhone }: LinkDriverButtonProps) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    // Check if this chat is already linked
    const { data: mapping, isLoading: mappingLoading } = useQuery({
        queryKey: ['telegram-driver-mapping', chatId],
        queryFn: async () => {
            const res = await fetch(apiUrl(`/api/telegram/users/${chatId}`));
            if (!res.ok) return null;
            const data = await res.json();
            return data.data?.driverMapping || null;
        },
    });

    // Fetch company drivers for dropdown
    const { data: drivers } = useQuery<DriverOption[]>({
        queryKey: ['drivers-for-linking'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/drivers?limit=200&isActive=true'));
            if (!res.ok) return [];
            const data = await res.json();
            return (data.data || []).map((d: any) => ({
                id: d.id,
                driverNumber: d.driverNumber || '',
                firstName: d.user?.firstName || d.firstName || '',
                lastName: d.user?.lastName || d.lastName || '',
                truckNumber: d.currentTruck?.truckNumber,
            }));
        },
        enabled: open,
    });

    const linkMutation = useMutation({
        mutationFn: async (driverId: string) => {
            const res = await fetch(apiUrl('/api/telegram/drivers'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId,
                    telegramId: chatId,
                    firstName: chatTitle.split(' ')[0],
                    lastName: chatTitle.split(' ').slice(1).join(' '),
                    phoneNumber: chatPhone,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to link driver');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Driver linked to Telegram chat');
            queryClient.invalidateQueries({ queryKey: ['telegram-driver-mapping', chatId] });
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs'] });
            setOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const unlinkMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(apiUrl(`/api/telegram/drivers/${chatId}`), { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to unlink');
            }
        },
        onSuccess: () => {
            toast.success('Driver unlinked');
            queryClient.invalidateQueries({ queryKey: ['telegram-driver-mapping', chatId] });
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs'] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    if (mappingLoading) return null;

    // Already linked — show driver badge
    if (mapping) {
        return (
            <div className="flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/30">
                <UserCheck className="h-3.5 w-3.5 text-green-600" />
                <span className="text-[11px] font-medium text-green-600 max-w-[100px] truncate">
                    {mapping.driverName}
                </span>
                {mapping.currentTruck && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                        <Truck className="h-2.5 w-2.5 mr-0.5" />{mapping.currentTruck}
                    </Badge>
                )}
                <button
                    onClick={() => { if (confirm('Unlink this driver?')) unlinkMutation.mutate(); }}
                    className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                    disabled={unlinkMutation.isPending}
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        );
    }

    // Not linked — show "Link Driver" button with dropdown
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 rounded-full">
                    <UserPlus className="h-3.5 w-3.5" />
                    Link Driver
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
                <Command>
                    <CommandInput placeholder="Search drivers..." />
                    <CommandList>
                        <CommandEmpty>No drivers found</CommandEmpty>
                        <CommandGroup>
                            {drivers?.map(d => (
                                <CommandItem
                                    key={d.id}
                                    value={`${d.firstName} ${d.lastName} ${d.driverNumber} ${d.truckNumber || ''}`}
                                    onSelect={() => linkMutation.mutate(d.id)}
                                    disabled={linkMutation.isPending}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div>
                                            <span className="font-medium">{d.firstName} {d.lastName}</span>
                                            {d.driverNumber && <span className="text-muted-foreground ml-1 text-xs">#{d.driverNumber}</span>}
                                        </div>
                                        {d.truckNumber && (
                                            <Badge variant="secondary" className="text-[10px] h-4">
                                                <Truck className="h-2.5 w-2.5 mr-0.5" />{d.truckNumber}
                                            </Badge>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                {linkMutation.isPending && (
                    <div className="flex items-center justify-center p-2 border-t">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-xs">Linking...</span>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
