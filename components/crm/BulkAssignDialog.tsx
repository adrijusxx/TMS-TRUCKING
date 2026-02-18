'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface BulkAssignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIds: string[];
    onSuccess: () => void;
}

export default function BulkAssignDialog({
    open,
    onOpenChange,
    selectedIds,
    onSuccess,
}: BulkAssignDialogProps) {
    const [assigneeId, setAssigneeId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch staff users for assignment
    const { data: staffData } = useQuery({
        queryKey: ['staff-users'],
        queryFn: async () => {
            const res = await fetch('/api/users/staff');
            if (!res.ok) throw new Error('Failed to fetch staff');
            return res.json();
        },
        enabled: open,
        staleTime: 60_000,
    });

    const users = staffData?.users || staffData || [];

    const handleSubmit = async () => {
        if (!assigneeId) {
            toast.error('Please select a recruiter');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/crm/leads/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: selectedIds,
                    action: 'assign',
                    payload: { assignedToId: assigneeId },
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to assign leads');
            }

            const data = await res.json();
            toast.success(`Assigned ${data.updated} lead(s) to recruiter`);
            onOpenChange(false);
            setAssigneeId('');
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign leads');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Assign Recruiter</DialogTitle>
                    <DialogDescription>
                        Assign {selectedIds.length} selected lead(s) to a recruiter
                    </DialogDescription>
                </DialogHeader>

                <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select recruiter" />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.isArray(users) && users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                                {user.role ? ` (${user.role})` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !assigneeId}>
                        {isSubmitting ? 'Assigning...' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
