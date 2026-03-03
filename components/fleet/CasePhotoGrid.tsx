'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Trash2, Upload, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface CasePhotoGridProps {
    breakdownId: string;
    pendingFiles: File[];
    pendingPreviews: string[];
    onRemovePending: (index: number) => void;
    onClearPending: () => void;
}

export default function CasePhotoGrid({ breakdownId, pendingFiles, pendingPreviews, onRemovePending, onClearPending }: CasePhotoGridProps) {
    const qc = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [viewUrl, setViewUrl] = useState<string | null>(null);

    const { data } = useQuery({
        queryKey: ['breakdown-photos', breakdownId],
        queryFn: async () => {
            const r = await fetch(apiUrl(`/api/breakdowns/${breakdownId}/documents?type=OTHER`));
            if (!r.ok) throw new Error('Failed');
            return r.json();
        },
    });
    const photos: { id: string; title: string; fileName: string; fileUrl: string; fileSize: number; createdAt: string }[] = data?.data?.documents || [];

    const uploadMut = useMutation({
        mutationFn: async () => {
            for (let i = 0; i < pendingFiles.length; i++) {
                const fd = new FormData();
                fd.append('file', pendingFiles[i]);
                fd.append('type', 'OTHER');
                fd.append('breakdownId', breakdownId);
                fd.append('title', `Photo ${photos.length + i + 1}`);
                fd.append('fileName', pendingFiles[i].name);
                fd.append('fileSize', pendingFiles[i].size.toString());
                fd.append('mimeType', pendingFiles[i].type);
                const r = await fetch(apiUrl('/api/documents/upload'), { method: 'POST', body: fd });
                if (!r.ok) throw new Error('Upload failed');
            }
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['breakdown-photos', breakdownId] }); toast.success(`${pendingFiles.length} photo(s) uploaded`); onClearPending(); },
        onError: (e: Error) => toast.error(e.message),
    });

    const delMut = useMutation({
        mutationFn: async (id: string) => { const r = await fetch(apiUrl(`/api/documents/${id}`), { method: 'DELETE' }); if (!r.ok) throw new Error('Failed'); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['breakdown-photos', breakdownId] }); toast.success('Deleted'); setDeleteId(null); },
        onError: (e: Error) => toast.error(e.message),
    });

    if (!photos.length && !pendingFiles.length) return null;

    return (
        <div className="space-y-1.5">
            {/* Existing */}
            {photos.length > 0 && (
                <div className="grid grid-cols-5 gap-1">
                    {photos.map(p => (
                        <div key={p.id} className="relative group aspect-square rounded overflow-hidden border bg-muted cursor-pointer" onClick={() => setViewUrl(p.fileUrl)}>
                            <img src={p.fileUrl} alt={p.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomIn className="h-4 w-4 text-white drop-shadow" />
                            </div>
                            <Button variant="destructive" size="icon" className="absolute top-0 right-0 h-4 w-4 rounded-none rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={e => { e.stopPropagation(); setDeleteId(p.id); }}><Trash2 className="h-2.5 w-2.5" /></Button>
                        </div>
                    ))}
                </div>
            )}
            {/* Pending */}
            {pendingFiles.length > 0 && (
                <>
                    <div className="grid grid-cols-5 gap-1">
                        {pendingPreviews.map((prev, i) => (
                            <div key={i} className="relative group aspect-square rounded overflow-hidden border border-dashed border-primary/40 bg-muted">
                                <img src={prev} alt="" className="w-full h-full object-cover opacity-75" />
                                <Button variant="destructive" size="icon" className="absolute top-0 right-0 h-4 w-4 rounded-none rounded-bl opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemovePending(i)}><X className="h-2.5 w-2.5" /></Button>
                            </div>
                        ))}
                    </div>
                    <Button size="sm" className="w-full h-6 text-[10px]" onClick={() => uploadMut.mutate()} disabled={uploadMut.isPending}>
                        {uploadMut.isPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading...</> : <><Upload className="h-3 w-3 mr-1" />Upload {pendingFiles.length}</>}
                    </Button>
                </>
            )}
            {/* Delete confirm — inline instead of dialog for compactness */}
            {deleteId && (
                <div className="flex items-center gap-2 p-1.5 border border-destructive/30 rounded bg-destructive/5 text-xs">
                    <span className="flex-1">Delete this photo?</span>
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => setDeleteId(null)}>Cancel</Button>
                    <Button variant="destructive" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => deleteId && delMut.mutate(deleteId)} disabled={delMut.isPending}>Delete</Button>
                </div>
            )}
            {/* Lightbox */}
            {viewUrl && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setViewUrl(null)}>
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 text-white hover:bg-white/20" onClick={() => setViewUrl(null)}>
                        <X className="h-6 w-6" />
                    </Button>
                    <img src={viewUrl} alt="Full size" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
                    <a href={viewUrl} download target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4" onClick={e => e.stopPropagation()}>
                        <Button variant="secondary" size="sm" className="gap-1.5"><Download className="h-4 w-4" />Download</Button>
                    </a>
                </div>
            )}
        </div>
    );
}
