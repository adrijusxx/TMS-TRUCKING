'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Trash2, Database, RefreshCw, Bot } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DocumentRow from './DocumentRow';

const CATEGORIES = ['ALL', 'DISPATCH', 'BREAKDOWN', 'COMPLIANCE', 'ONBOARDING', 'SETTLEMENT', 'GENERAL'];

interface Agent {
    id: string;
    name: string;
    slug: string;
}

export default function KBDocumentList() {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; filename: string; percent: number } | null>(null);
    const [uploadAgentId, setUploadAgentId] = useState<string>('');
    const [viewingDoc, setViewingDoc] = useState<any | null>(null);
    const [docContent, setDocContent] = useState<string | null>(null);
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { data: documents, isLoading } = useQuery({
        queryKey: ['knowledge-base-docs'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/knowledge-base'));
            if (!res.ok) throw new Error('Failed to fetch documents');
            return (await res.json()).data || [];
        },
    });

    const { data: agents } = useQuery<Agent[]>({
        queryKey: ['ai-agents'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/ai/agents'));
            if (!res.ok) return [];
            return (await res.json()).data || [];
        },
    });

    const uploadFile = (file: File, agentId: string, onProgress: (p: number) => void): Promise<any> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);
            if (agentId) formData.append('agentId', agentId);

            xhr.open('POST', apiUrl('/api/knowledge-base/upload'));
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    let msg = `Failed to upload ${file.name}`;
                    try { msg = JSON.parse(xhr.responseText).error || msg; } catch { /* ignore */ }
                    reject(new Error(msg));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;

        const valid = Array.from(files).filter(f => {
            const ok = ['application/pdf', 'text/plain', 'text/markdown'].includes(f.type) || f.name.endsWith('.md');
            const sizeOk = f.size <= 10 * 1024 * 1024;
            if (!ok) toast.error(`Skipped ${f.name}: Invalid type`);
            if (!sizeOk) toast.error(`Skipped ${f.name}: Too large`);
            return ok && sizeOk;
        });

        setIsUploading(true);
        let done = 0;
        for (const file of valid) {
            try {
                setUploadProgress({ current: done + 1, total: valid.length, filename: file.name, percent: 0 });
                await uploadFile(file, uploadAgentId, (p) => setUploadProgress(prev => prev ? { ...prev, percent: p } : null));
                done++;
                toast.success(`Uploaded ${file.name}`);
            } catch (err: any) {
                toast.error(err.message);
            }
        }
        setUploadProgress(null);
        setIsUploading(false);
        queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] });
    };

    const handleViewDoc = async (doc: any) => {
        setViewingDoc(doc);
        setIsLoadingDoc(true);
        setDocContent(null);
        try {
            const res = await fetch(apiUrl(`/api/knowledge-base/${doc.id}`));
            if (!res.ok) throw new Error('Failed to fetch content');
            setDocContent((await res.json()).data.fullContent);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoadingDoc(false);
        }
    };

    const handleSyncLearning = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(apiUrl('/api/admin/system/ai/sync'), { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Sync failed');
            toast.success(`Sync complete! ${data.ingestedCount || 0} conversations processed.`);
            queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(apiUrl(`/api/knowledge-base?id=${id}`), { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
        },
        onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] }); },
        onError: (e: Error) => toast.error(e.message),
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            const res = await fetch(apiUrl('/api/knowledge-base'), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
            if (!res.ok) throw new Error('Bulk delete failed');
            return res.json();
        },
        onSuccess: (d) => { toast.success(`Deleted ${d.count} docs`); queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] }); setSelectedIds([]); },
        onError: (e: Error) => toast.error(e.message),
    });

    const fileDocs = documents?.filter((d: any) => d.url !== 'internal') || [];
    const learnedDocs = documents?.filter((d: any) => d.url === 'internal') || [];
    const totalChunks = documents?.reduce((a: number, d: any) => a + (d._count?.chunks || 0), 0) || 0;

    const filteredLearned = selectedCategory === 'ALL'
        ? learnedDocs
        : learnedDocs.filter((d: any) => {
            const m = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata;
            return m?.category === selectedCategory;
        });

    return (
        <div className="space-y-6">
            {/* Stats + Actions */}
            <div className="flex items-center justify-between">
                <div className="grid grid-cols-4 gap-4 flex-1 mr-4">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Documents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fileDocs.length}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Learned</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{learnedDocs.length}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Chunks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalChunks}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{documents?.filter((d: any) => d.status === 'READY').length || 0}</div></CardContent></Card>
                </div>
                <div className="flex gap-2 items-end">
                    <Button variant="outline" size="sm" onClick={handleSyncLearning} disabled={isSyncing}>
                        {isSyncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Bot className="h-4 w-4 mr-1" />}
                        Sync
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] })}>
                        <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Upload bar */}
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                <Select value={uploadAgentId} onValueChange={setUploadAgentId}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Agents (Shared)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Agents (Shared)</SelectItem>
                        {agents?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="relative flex-1">
                    <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} accept=".pdf,.txt,.md" multiple disabled={isUploading} />
                    <Button className="w-full" disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        {isUploading ? 'Uploading...' : 'Upload Documents (PDF, TXT, MD)'}
                    </Button>
                </div>
            </div>

            {uploadProgress && (
                <div className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/50 border-primary/20">
                    <div className="flex items-center gap-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div>
                            <h4 className="font-semibold text-sm">Importing {uploadProgress.filename}</h4>
                            <p className="text-xs text-muted-foreground">File {uploadProgress.current}/{uploadProgress.total} ({Math.round(uploadProgress.percent)}%)</p>
                        </div>
                    </div>
                    <Progress value={uploadProgress.percent} className="h-2" />
                </div>
            )}

            {/* Document tabs */}
            <Card>
                <CardHeader>
                    <CardTitle>Knowledge Explorer</CardTitle>
                    <CardDescription>Uploaded documents and AI-synthesized knowledge from conversations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="files" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="files" className="gap-2">
                                <FileText className="h-4 w-4" /> Uploaded <Badge variant="secondary" className="ml-1">{fileDocs.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="learned" className="gap-2">
                                <Bot className="h-4 w-4" /> Learned <Badge variant="secondary" className="ml-1 text-blue-600">{learnedDocs.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="files" className="space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                            ) : fileDocs.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                                    <Database className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No documents yet. Upload PDF, TXT, or MD files.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {fileDocs.map((doc: any) => (
                                        <DocumentRow key={doc.id} doc={doc} agentName={doc.agent?.name} onView={() => handleViewDoc(doc)} onDelete={() => deleteMutation.mutate(doc.id)} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="learned" className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => (
                                        <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)} className="text-xs">
                                            {cat}
                                            {cat !== 'ALL' && (
                                                <Badge variant="secondary" className="ml-1 text-[10px]">
                                                    {learnedDocs.filter((d: any) => { const m = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata; return m?.category === cat; }).length}
                                                </Badge>
                                            )}
                                        </Button>
                                    ))}
                                </div>
                                {filteredLearned.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={selectedIds.length === filteredLearned.length && filteredLearned.length > 0} onCheckedChange={() => {
                                            setSelectedIds(prev => prev.length === filteredLearned.length ? [] : filteredLearned.map((d: any) => d.id));
                                        }} />
                                        <span className="text-sm text-muted-foreground">All</span>
                                        {selectedIds.length > 0 && (
                                            <Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete ${selectedIds.length} docs?`)) bulkDeleteMutation.mutate(selectedIds); }} disabled={bulkDeleteMutation.isPending}>
                                                <Trash2 className="h-4 w-4 mr-1" /> Delete ({selectedIds.length})
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                            {filteredLearned.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                                    <Bot className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No {selectedCategory !== 'ALL' ? selectedCategory.toLowerCase() : ''} documents yet.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredLearned.map((doc: any) => {
                                        const m = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
                                        return (
                                            <DocumentRow key={doc.id} doc={doc} isLearned category={m?.category} agentName={doc.agent?.name}
                                                onView={() => handleViewDoc(doc)} onDelete={() => deleteMutation.mutate(doc.id)}
                                                selected={selectedIds.includes(doc.id)} onToggle={() => setSelectedIds(p => p.includes(doc.id) ? p.filter(x => x !== doc.id) : [...p, doc.id])} />
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Content Viewer */}
            <Sheet open={!!viewingDoc} onOpenChange={(o) => !o && setViewingDoc(null)}>
                <SheetContent side="right" className="sm:max-w-xl">
                    <SheetHeader className="pb-4">
                        <div className="flex items-center gap-2 mb-2">
                            {viewingDoc?.url === 'internal' ? <Bot className="h-5 w-5 text-blue-600" /> : <FileText className="h-5 w-5" />}
                            <SheetTitle className="text-xl">{viewingDoc?.title}</SheetTitle>
                        </div>
                        <SheetDescription>
                            {viewingDoc?.url === 'internal' ? 'AI-synthesized knowledge' : `Uploaded ${viewingDoc && new Date(viewingDoc.createdAt).toLocaleDateString()}`}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 border rounded-lg bg-muted/30 h-[calc(100vh-180px)]">
                        {isLoadingDoc ? (
                            <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <ScrollArea className="h-full p-6">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    {docContent ? docContent.split('\n').map((line, i) => <p key={i} className="mb-4 text-sm leading-relaxed">{line}</p>) : <p className="text-muted-foreground italic">No content.</p>}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
