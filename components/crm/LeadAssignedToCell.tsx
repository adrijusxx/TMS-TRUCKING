'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UserX, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StaffUser {
    id: string;
    firstName: string;
    lastName: string;
}

interface LeadAssignedToCellProps {
    leadId: string;
    assignedTo: { firstName: string; lastName: string } | null;
    onAssigned: () => void;
}

export default function LeadAssignedToCell({ leadId, assignedTo, onAssigned }: LeadAssignedToCellProps) {
    const [open, setOpen] = useState(false);
    const [staff, setStaff] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && staff.length === 0) {
            fetch('/api/users/staff?recruiter=true')
                .then(r => r.json())
                .then(data => setStaff(Array.isArray(data.data) ? data.data : []))
                .catch(() => {});
        }
    }, [open, staff.length]);

    const handleAssign = async (userId: string | null) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedToId: userId }),
            });
            if (!res.ok) throw new Error('Failed to assign');
            toast.success(userId ? 'Lead assigned' : 'Lead unassigned');
            setOpen(false);
            onAssigned();
        } catch {
            toast.error('Failed to assign lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        'flex items-center gap-1.5 text-xs rounded px-1.5 py-0.5 transition-colors',
                        'hover:bg-muted/80',
                        assignedTo ? 'text-foreground' : 'text-muted-foreground/60'
                    )}
                >
                    {assignedTo ? (
                        <>
                            <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">
                                    {assignedTo.firstName[0]}{assignedTo.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[80px]">
                                {assignedTo.firstName} {assignedTo.lastName[0]}.
                            </span>
                        </>
                    ) : (
                        <>
                            <UserX className="h-3.5 w-3.5" />
                            <span>Unassigned</span>
                        </>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <Command>
                    <CommandInput placeholder="Search recruiter..." />
                    <CommandList>
                        <CommandEmpty>No recruiters found</CommandEmpty>
                        <CommandGroup>
                            {assignedTo && (
                                <CommandItem onSelect={() => handleAssign(null)} disabled={loading}>
                                    <UserX className="h-4 w-4 mr-2 text-muted-foreground" />
                                    Unassign
                                </CommandItem>
                            )}
                            {staff.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    onSelect={() => handleAssign(user.id)}
                                    disabled={loading}
                                >
                                    <Avatar className="h-5 w-5 mr-2">
                                        <AvatarFallback className="text-[10px]">
                                            {user.firstName[0]}{user.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    {user.firstName} {user.lastName}
                                    {assignedTo?.firstName === user.firstName && assignedTo?.lastName === user.lastName && (
                                        <Check className="h-4 w-4 ml-auto" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
