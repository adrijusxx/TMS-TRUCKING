'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, ArrowRight, Merge } from 'lucide-react';

interface MergeLeadsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    primaryLeadId: string;
    primaryLeadName: string;
    onSuccess: () => void;
}

export default function MergeLeadsDialog({
    open, onOpenChange, primaryLeadId, primaryLeadName, onSuccess,
}: MergeLeadsDialogProps) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [merging, setMerging] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['merge-search', search],
        queryFn: async () => {
            if (!search || search.length < 2) return { leads: [] };
            const res = await fetch(`/api/crm/leads?search=${encodeURIComponent(search)}&limit=10`);
            if (!res.ok) return { leads: [] };
            return res.json();
        },
        enabled: open && search.length >= 2,
    });

    const candidates = (data?.leads || []).filter((l: any) => l.id !== primaryLeadId);

    const handleMerge = async () => {
        if (!selectedId) return;
        setMerging(true);
        try {
            const res = await fetch('/api/crm/leads/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ primaryId: primaryLeadId, secondaryId: selectedId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Merge failed');
            }
            toast.success('Leads merged successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to merge');
        } finally {
            setMerging(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Merge className="h-4 w-4" />
                        Merge Leads
                    </DialogTitle>
                    <DialogDescription>
                        Keep <strong>{primaryLeadName}</strong> as the primary lead and merge another into it.
                        Notes, activities, and documents will be moved to the primary lead.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search for duplicate lead..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setSelectedId(null); }}
                            className="pl-9"
                        />
                    </div>

                    {isLoading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    )}

                    {candidates.length > 0 && (
                        <div className="max-h-48 overflow-y-auto border rounded-md">
                            {candidates.map((lead: any) => (
                                <button
                                    key={lead.id}
                                    type="button"
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b last:border-0 ${
                                        selectedId === lead.id ? 'bg-muted' : ''
                                    }`}
                                    onClick={() => setSelectedId(lead.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                                        <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{lead.phone} {lead.email ? `| ${lead.email}` : ''}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedId && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
                            <span className="font-medium">{candidates.find((l: any) => l.id === selectedId)?.firstName}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                            <span className="font-medium">{primaryLeadName}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleMerge}
                        disabled={!selectedId || merging}
                        variant="destructive"
                    >
                        {merging && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Merge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
