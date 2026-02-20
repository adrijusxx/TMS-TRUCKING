'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UserPlus, UserX, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StaffUser {
    id: string;
    firstName: string;
    lastName: string;
}

interface LeadAssignDropdownProps {
    leadId: string;
    currentAssignee?: { id: string; firstName: string; lastName: string } | null;
    onAssigned: () => void;
}

export default function LeadAssignDropdown({ leadId, currentAssignee, onAssigned }: LeadAssignDropdownProps) {
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
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Assigned Recruiter</label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-9"
                    >
                        {currentAssignee ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[10px]">
                                        {currentAssignee.firstName[0]}{currentAssignee.lastName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                    {currentAssignee.firstName} {currentAssignee.lastName}
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                Assign recruiter...
                            </span>
                        )}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search recruiter..." />
                        <CommandList>
                            <CommandEmpty>No recruiters found</CommandEmpty>
                            <CommandGroup>
                                {currentAssignee && (
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
                                        {currentAssignee?.id === user.id && (
                                            <Check className={cn('h-4 w-4 ml-auto')} />
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
