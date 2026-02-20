'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send, MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
    id: string;
    content: string;
    createdAt: string;
    createdById: string;
    user: {
        firstName: string;
        lastName: string;
    };
}

interface LeadNotesProps {
    leadId: string;
    currentUserId?: string;
}

export default function LeadNotes({ leadId, currentUserId }: LeadNotesProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
            fetchNotes();
            toast.success('Note added');
        } catch {
            toast.error('Failed to add note');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (noteId: string) => {
        if (!editContent.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ noteId, content: editContent }),
            });
            if (!res.ok) throw new Error('Failed to update note');
            setEditingId(null);
            fetchNotes();
            toast.success('Note updated');
        } catch {
            toast.error('Failed to update note');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/notes?noteId=${deleteId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete note');
            setDeleteId(null);
            fetchNotes();
            toast.success('Note deleted');
        } catch {
            toast.error('Failed to delete note');
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
                            <NoteItem
                                key={note.id}
                                note={note}
                                isOwner={currentUserId === note.createdById}
                                isEditing={editingId === note.id}
                                editContent={editContent}
                                onStartEdit={() => { setEditingId(note.id); setEditContent(note.content); }}
                                onCancelEdit={() => setEditingId(null)}
                                onSaveEdit={() => handleEdit(note.id)}
                                onEditContentChange={setEditContent}
                                onDelete={() => setDeleteId(note.id)}
                                loading={loading}
                            />
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

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this note? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface NoteItemProps {
    note: Note;
    isOwner: boolean;
    isEditing: boolean;
    editContent: string;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onEditContentChange: (val: string) => void;
    onDelete: () => void;
    loading: boolean;
}

function NoteItem({ note, isOwner, isEditing, editContent, onStartEdit, onCancelEdit, onSaveEdit, onEditContentChange, onDelete, loading }: NoteItemProps) {
    return (
        <div className="flex gap-3 group">
            <Avatar className="h-8 w-8">
                <AvatarFallback>
                    {note.user.firstName[0]}{note.user.lastName[0]}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                        {note.user.firstName} {note.user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                    {isOwner && !isEditing && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onStartEdit}>
                                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea value={editContent} onChange={(e) => onEditContentChange(e.target.value)}
                            className="min-h-[60px]" />
                        <div className="flex gap-1.5">
                            <Button size="sm" className="h-7" onClick={onSaveEdit} disabled={loading || !editContent.trim()}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7" onClick={onCancelEdit}>
                                <X className="h-3.5 w-3.5 mr-1" /> Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm bg-muted p-2 rounded-md whitespace-pre-wrap">
                        {note.content}
                    </p>
                )}
            </div>
        </div>
    );
}
