'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowRight, UserPlus, MessageSquare, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LeadBulkActionBarProps {
    selectedCount: number;
    selectedIds: string[];
    onChangeStatus: () => void;
    onAssign: () => void;
    onSendSms: () => void;
    onSendEmail: () => void;
    onClear: () => void;
    onBulkDelete?: () => void;
}

export default function LeadBulkActionBar({
    selectedCount, selectedIds, onChangeStatus, onAssign,
    onSendSms, onSendEmail, onClear, onBulkDelete,
}: LeadBulkActionBarProps) {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (selectedCount === 0) return null;

    const handleBulkDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch('/api/crm/leads/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, action: 'delete' }),
            });
            if (!res.ok) throw new Error('Delete failed');
            toast.success(`${selectedCount} lead(s) archived`);
            setDeleteConfirmOpen(false);
            onBulkDelete?.();
        } catch {
            toast.error('Failed to delete leads');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <span className="text-sm font-medium">
                    {selectedCount} selected
                </span>
                <Button variant="outline" size="sm" onClick={onChangeStatus} className="gap-1">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Status
                </Button>
                <Button variant="outline" size="sm" onClick={onAssign} className="gap-1">
                    <UserPlus className="h-3.5 w-3.5" />
                    Assign
                </Button>
                <Button variant="outline" size="sm" onClick={onSendSms} className="gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    SMS
                </Button>
                <Button variant="outline" size="sm" onClick={onSendEmail} className="gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={onClear}>
                    Clear
                </Button>
            </div>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedCount} Lead(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will soft-delete the selected leads. They can be restored by an admin later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
