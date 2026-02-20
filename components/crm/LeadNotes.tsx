'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
    id: string;
    content: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
    };
}

export default function LeadNotes({ leadId }: { leadId: string }) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchNotes = async () => {
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/notes`);
            if (!res.ok) throw new Error('Failed to fetch notes');
            const data = await res.json();
            setNotes(data.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load notes', { id: `notes-error-${leadId}` });
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        if (leadId) fetchNotes();
    }, [leadId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newNote }),
            });

            if (!res.ok) throw new Error('Failed to create note');

            setNewNote('');
            fetchNotes(); // Refresh list
            toast.success('Note added');
        } catch (error) {
            toast.error('Failed to add note');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex flex-col h-[500px]">
            <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                    {notes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No notes yet</p>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        {note.user.firstName[0]}{note.user.lastName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">
                                            {note.user.firstName} {note.user.lastName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm bg-muted p-2 rounded-md whitespace-pre-wrap">
                                        {note.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="min-h-[80px]"
                />
                <Button type="submit" size="icon" disabled={loading || !newNote.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
        </div>
    );
}
