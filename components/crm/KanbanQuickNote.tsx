'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanQuickNoteProps {
    leadId: string;
    onNoteAdded?: () => void;
}

export default function KanbanQuickNote({ leadId, onNoteAdded }: KanbanQuickNoteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!note.trim()) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: note.trim() }),
            });
            if (!res.ok) throw new Error('Failed');
            setNote('');
            setIsOpen(false);
            toast.success('Note added');
            onNoteAdded?.();
        } catch {
            toast.error('Failed to add note');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                className="w-full text-xs text-muted-foreground hover:text-primary flex items-center gap-1 pt-1 transition-colors"
            >
                <Plus className="h-3 w-3" /> Quick note
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="pt-1">
            <div className="flex items-center gap-1">
                <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note..."
                    className="h-7 text-xs"
                    autoFocus
                    onBlur={() => { if (!note.trim()) setIsOpen(false); }}
                    onKeyDown={(e) => { if (e.key === 'Escape') { setNote(''); setIsOpen(false); } }}
                    disabled={saving}
                />
                {saving && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
            </div>
        </form>
    );
}
