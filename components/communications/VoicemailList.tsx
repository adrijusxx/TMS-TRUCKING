'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Voicemail, Play, Pause, Trash2, Archive, Clock, Phone, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type VmFolder = 'new' | 'saved' | 'deleted';

interface VmItem {
  id: string;
  from?: string;
  from_name?: string;
  duration?: number;
  created_at?: string;
  audio_url?: string;
  transcription?: string;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VoicemailItem({
  vm,
  folder,
  onDelete,
  onSave,
}: {
  vm: VmItem;
  folder: VmFolder;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (playing && audio) {
      audio.pause();
      setPlaying(false);
      return;
    }

    if (!vm.audio_url) {
      toast.error('No audio available for this voicemail');
      return;
    }

    const a = new Audio(vm.audio_url);
    a.onended = () => setPlaying(false);
    a.play().catch(() => toast.error('Failed to play audio'));
    setAudio(a);
    setPlaying(true);
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <Button variant="ghost" size="icon" onClick={togglePlay} className="shrink-0">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {vm.from_name ? (
            <span className="font-medium text-sm truncate">{vm.from_name}</span>
          ) : (
            <span className="font-medium text-sm">{vm.from || 'Unknown'}</span>
          )}
          {vm.from && vm.from_name && (
            <span className="text-xs text-muted-foreground">{vm.from}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(vm.duration)}
          </span>
          {vm.created_at && (
            <span>{formatDistanceToNow(new Date(vm.created_at), { addSuffix: true })}</span>
          )}
        </div>
        {vm.transcription && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{vm.transcription}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {folder === 'new' && (
          <Button variant="ghost" size="icon" onClick={() => onSave(vm.id)} title="Save">
            <Archive className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onDelete(vm.id)} title="Delete">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function VoicemailList() {
  const [folder, setFolder] = useState<VmFolder>('new');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['netsapiens-voicemail', folder],
    queryFn: async () => {
      const res = await fetch(`/api/integrations/netsapiens/voicemail?folder=${folder}`);
      if (!res.ok) throw new Error('Failed to load voicemails');
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/integrations/netsapiens/voicemail?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netsapiens-voicemail'] });
      toast.success('Voicemail deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/integrations/netsapiens/voicemail?id=${id}&action=save`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to save');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netsapiens-voicemail'] });
      toast.success('Voicemail saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const voicemails: VmItem[] = data?.data || [];
  const count = data?.count ?? voicemails.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Voicemail className="h-5 w-5" />
          Voicemail
          {folder === 'new' && count > 0 && (
            <Badge variant="destructive" className="ml-2">{count}</Badge>
          )}
        </CardTitle>
        <CardDescription>Your voicemail messages from the PBX</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={folder} onValueChange={(v) => setFolder(v as VmFolder)}>
          <TabsList className="mb-4">
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="deleted">Deleted</TabsTrigger>
          </TabsList>

          <TabsContent value={folder}>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : voicemails.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-8">
                No {folder} voicemails
              </p>
            ) : (
              <div className="space-y-2">
                {voicemails.map((vm) => (
                  <VoicemailItem
                    key={vm.id}
                    vm={vm}
                    folder={folder}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onSave={(id) => saveMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
