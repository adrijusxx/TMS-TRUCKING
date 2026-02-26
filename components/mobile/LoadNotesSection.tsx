'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  createdAt: string;
  createdBy?: string;
}

interface LoadNotesSectionProps {
  loadId: string;
}

export default function LoadNotesSection({ loadId }: LoadNotesSectionProps) {
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['load-notes', loadId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/mobile/messages?loadId=${loadId}`));
      if (!response.ok) return { data: [] };
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 30000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(apiUrl('/api/mobile/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, loadId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to send note');
      }
      return response.json();
    },
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['load-notes', loadId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const notes: Note[] = Array.isArray(data) ? data : [];

  const handleSend = () => {
    if (!newNote.trim()) return;
    sendMutation.mutate(newNote.trim());
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Notes List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-2">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No notes yet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-2 rounded-lg text-sm ${
                  note.direction === 'INBOUND'
                    ? 'bg-primary/10 ml-0 mr-8'
                    : 'bg-muted ml-8 mr-0'
                }`}
              >
                <p>{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {note.direction === 'OUTBOUND' && note.createdBy && `${note.createdBy} · `}
                  {formatDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Send Note */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={1}
            className="min-h-[40px] resize-none"
          />
          <Button
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={handleSend}
            disabled={!newNote.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
