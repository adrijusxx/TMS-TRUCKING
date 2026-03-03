'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, X, UserPlus, Loader2, Truck, AlertTriangle, Users, Ban, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface ReviewItem {
    id: string;
    type: string;
    telegramChatId: string;
    chatTitle?: string;
    senderName?: string;
    messageContent: string;
    aiCategory?: string;
    aiConfidence?: number;
    aiUrgency?: string;
    driverId?: string;
    driver?: {
        id: string;
        user: { firstName: string; lastName: string; phone?: string };
        currentTruck?: { id: string; truckNumber: string; currentLocation?: string };
    };
    suggestedDriverId?: string;
    suggestedDriver?: {
        id: string;
        user: { firstName: string; lastName: string; phone?: string };
        currentTruck?: { id: string; truckNumber: string };
    };
    matchConfidence?: number;
    matchMethod?: string;
}

interface DriverOption {
    id: string;
    driverNumber: string;
    firstName: string;
    lastName: string;
    truckNumber?: string;
}

interface StaffOption {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
}

export default function ReviewItemActions({ item, onResolved }: { item: ReviewItem; onResolved: () => void }) {
    const queryClient = useQueryClient();
    const [driverOpen, setDriverOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<DriverOption | null>(null);
    const [dismissNote, setDismissNote] = useState('');
    const [showDismiss, setShowDismiss] = useState(false);
    const [staffOpen, setStaffOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffOption | null>(null);
    const [showIgnoreConfirm, setShowIgnoreConfirm] = useState(false);

    // Pre-select suggested driver if available
    useEffect(() => {
        if (item.suggestedDriver && item.type === 'DRIVER_LINK_NEEDED' && !selectedDriver) {
            setSelectedDriver({
                id: item.suggestedDriver.id,
                driverNumber: '',
                firstName: item.suggestedDriver.user.firstName,
                lastName: item.suggestedDriver.user.lastName,
                truckNumber: item.suggestedDriver.currentTruck?.truckNumber,
            });
        }
    }, [item.suggestedDriver]); // eslint-disable-line react-hooks/exhaustive-deps

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
        enabled: driverOpen,
    });

    const { data: staffList } = useQuery<StaffOption[]>({
        queryKey: ['staff-for-assignment'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/users/staff?limit=50'));
            if (!res.ok) return [];
            const data = await res.json();
            return data.data || [];
        },
        enabled: staffOpen,
    });

    const approveMutation = useMutation({
        mutationFn: async (params: { driverId?: string; createCase?: boolean }) => {
            const res = await fetch(apiUrl(`/api/telegram/review-queue/${item.id}/approve`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...params,
                    assignedToUserId: selectedStaff?.id,
                    assignmentRole: 'Support',
                }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
            return res.json();
        },
        onSuccess: (data) => {
            const bd = data.data?.breakdown;
            toast.success(bd ? `Approved — Case ${bd.breakdownNumber} created` : 'Approved');
            queryClient.invalidateQueries({ queryKey: ['telegram-review-queue'] });
            queryClient.invalidateQueries({ queryKey: ['telegram-review-stats'] });
            onResolved();
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const dismissMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(apiUrl(`/api/telegram/review-queue/${item.id}/dismiss`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: dismissNote || undefined }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Dismissed');
            queryClient.invalidateQueries({ queryKey: ['telegram-review-queue'] });
            queryClient.invalidateQueries({ queryKey: ['telegram-review-stats'] });
            setShowDismiss(false);
            onResolved();
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const ignoreMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(apiUrl(`/api/telegram/review-queue/${item.id}/ignore`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Manually ignored by staff' }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Contact permanently ignored');
            queryClient.invalidateQueries({ queryKey: ['telegram-review-queue'] });
            queryClient.invalidateQueries({ queryKey: ['telegram-review-stats'] });
            setShowIgnoreConfirm(false);
            onResolved();
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const isPending = approveMutation.isPending || dismissMutation.isPending || ignoreMutation.isPending;

    const staffPicker = (
        <Popover open={staffOpen} onOpenChange={setStaffOpen}>
            <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Users className="h-3 w-3" />
                    {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : 'Assign To'}
                    {selectedStaff && (
                        <X className="h-2.5 w-2.5 ml-0.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedStaff(null); }} />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="end">
                <Command>
                    <CommandInput placeholder="Search staff..." />
                    <CommandList>
                        <CommandEmpty>No staff found</CommandEmpty>
                        <CommandGroup>
                            {staffList?.map(s => (
                                <CommandItem key={s.id}
                                    value={`${s.firstName} ${s.lastName} ${s.role}`}
                                    onSelect={() => { setSelectedStaff(s); setStaffOpen(false); }}>
                                    <Check className={`mr-1.5 h-3 w-3 ${selectedStaff?.id === s.id ? 'opacity-100' : 'opacity-0'}`} />
                                    <span className="text-xs">{s.firstName} {s.lastName}</span>
                                    <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1">{s.role}</Badge>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );

    const ignoreConfirmDialog = (
        <AlertDialog open={showIgnoreConfirm} onOpenChange={setShowIgnoreConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Ignore this contact forever?</AlertDialogTitle>
                    <AlertDialogDescription>
                        All messages from <strong>{item.senderName || item.chatTitle || item.telegramChatId}</strong> will
                        be permanently ignored. No AI processing, review items, or responses will be generated.
                        You can un-ignore from the Ignored tab later.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => ignoreMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {ignoreMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                        Ignore Forever
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    // DRIVER_LINK_NEEDED: need to pick a driver first, then approve
    if (item.type === 'DRIVER_LINK_NEEDED') {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                {item.suggestedDriverId && item.matchConfidence && (
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30 gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" />
                        Suggested ({Math.round(item.matchConfidence * 100)}% {item.matchMethod?.toLowerCase()})
                    </Badge>
                )}
                {selectedDriver ? (
                    <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs">
                            {selectedDriver.firstName} {selectedDriver.lastName}
                            {selectedDriver.truckNumber && <> <Truck className="h-2.5 w-2.5 ml-0.5 inline" />{selectedDriver.truckNumber}</>}
                        </Badge>
                        {staffPicker}
                        <Button size="sm" className="h-7 text-xs" disabled={isPending}
                            onClick={() => approveMutation.mutate({ driverId: selectedDriver.id, createCase: true })}>
                            {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                            Approve & Create Case
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={isPending}
                            onClick={() => approveMutation.mutate({ driverId: selectedDriver.id, createCase: false })}>
                            Link Only
                        </Button>
                    </div>
                ) : (
                    <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                <UserPlus className="h-3 w-3" /> Select Driver
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[260px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Search drivers..." />
                                <CommandList>
                                    <CommandEmpty>No drivers found</CommandEmpty>
                                    <CommandGroup>
                                        {drivers?.map(d => (
                                            <CommandItem key={d.id}
                                                value={`${d.firstName} ${d.lastName} ${d.driverNumber} ${d.truckNumber || ''}`}
                                                onSelect={() => { setSelectedDriver(d); setDriverOpen(false); }}>
                                                <span className="font-medium">{d.firstName} {d.lastName}</span>
                                                {d.truckNumber && <Badge variant="secondary" className="ml-auto text-[10px] h-4"><Truck className="h-2.5 w-2.5 mr-0.5" />{d.truckNumber}</Badge>}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
                <DismissButton show={showDismiss} setShow={setShowDismiss} note={dismissNote}
                    setNote={setDismissNote} onDismiss={() => dismissMutation.mutate()} isPending={isPending} />
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" disabled={isPending}
                    onClick={() => setShowIgnoreConfirm(true)}>
                    <Ban className="h-3 w-3 mr-1" /> Ignore Forever
                </Button>
                {ignoreConfirmDialog}
            </div>
        );
    }

    // CASE_APPROVAL: driver already linked, just approve or dismiss
    return (
        <div className="flex items-center gap-2">
            {staffPicker}
            <Button size="sm" className="h-7 text-xs" disabled={isPending}
                onClick={() => approveMutation.mutate({ createCase: true })}>
                {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                Approve & Create Case
            </Button>
            <DismissButton show={showDismiss} setShow={setShowDismiss} note={dismissNote}
                setNote={setDismissNote} onDismiss={() => dismissMutation.mutate()} isPending={isPending} />
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" disabled={isPending}
                onClick={() => setShowIgnoreConfirm(true)}>
                <Ban className="h-3 w-3 mr-1" /> Ignore Forever
            </Button>
            {ignoreConfirmDialog}
        </div>
    );
}

function DismissButton({ show, setShow, note, setNote, onDismiss, isPending }: {
    show: boolean; setShow: (v: boolean) => void; note: string; setNote: (v: string) => void;
    onDismiss: () => void; isPending: boolean;
}) {
    if (!show) {
        return (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" disabled={isPending}
                onClick={() => setShow(true)}>
                <X className="h-3 w-3 mr-1" /> Dismiss
            </Button>
        );
    }
    return (
        <div className="flex items-center gap-1">
            <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
                className="h-7 text-xs w-32" />
            <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={isPending} onClick={onDismiss}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShow(false)}>Cancel</Button>
        </div>
    );
}
