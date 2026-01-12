'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Trash2, Database, RefreshCw, File, Bot } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function KnowledgeBaseManager() {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; filename: string; percent: number } | null>(null);
    const [viewingDoc, setViewingDoc] = useState<any | null>(null);
    const [docContent, setDocContent] = useState<string | null>(null);
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);

    const { data: documents, isLoading } = useQuery({
        queryKey: ['knowledge-base-docs'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/knowledge-base'));
            if (!res.ok) throw new Error('Failed to fetch documents');
            const data = await res.json();
            return data.data || [];
        },
    });

    // Helper function to upload a single file with progress
    const uploadFile = (file: File, onProgress: (percent: number) => void): Promise<any> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);

            xhr.open('POST', apiUrl('/api/knowledge-base/upload'));

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    let errorMessage = `Failed to upload ${file.name}`;
                    try {
                        const err = JSON.parse(xhr.responseText);
                        if (err.error) errorMessage = err.error;
                    } catch (e) {
                        // ignore
                    }
                    reject(new Error(errorMessage));
                }
            };

            xhr.onerror = () => reject(new Error('Network error during upload'));

            xhr.send(formData);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Convert FileList to array for easier handling
        const fileList = Array.from(files);

        // Filter valid files
        const validFiles = fileList.filter(file => {
            const isValidType = ['application/pdf', 'text/plain', 'text/markdown'].includes(file.type) || file.name.endsWith('.md');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

            if (!isValidType) toast.error(`Skipped ${file.name}: Invalid file type`);
            if (!isValidSize) toast.error(`Skipped ${file.name}: File too large (>10MB)`);

            return isValidType && isValidSize;
        });

        if (validFiles.length === 0) return;

        setIsUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            setUploadProgress({
                current: i + 1,
                total: validFiles.length,
                filename: file.name,
                percent: 0
            });

            try {
                await uploadFile(file, (percent) => {
                    setUploadProgress(prev => prev ? { ...prev, percent } : null);
                });
                successCount++;
            } catch (err: any) {
                console.error(`Error uploading ${file.name}:`, err);
                failCount++;
                toast.error(`Failed to upload ${file.name}: ${err.message}`);
            }
        }

        // Cleanup
        setIsUploading(false);
        setUploadProgress(null);
        e.target.value = ''; // Reset input

        // Refresh and notify
        queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] });

        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} documents`);
        }
        if (failCount > 0) {
            toast.warning(`Failed to upload ${failCount} documents`);
        }
    };

    const handleViewDoc = async (doc: any) => {
        setViewingDoc(doc);
        setIsLoadingDoc(true);
        setDocContent(null);
        try {
            const res = await fetch(apiUrl(`/api/knowledge-base/${doc.id}`));
            if (!res.ok) throw new Error('Failed to fetch document content');
            const data = await res.json();
            setDocContent(data.data.fullContent);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoadingDoc(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'READY': return 'bg-green-500';
            case 'PROCESSING': return 'bg-yellow-500';
            case 'FAILED': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Filter documents by source
    const fileDocuments = documents?.filter((doc: any) => doc.url !== 'internal') || [];
    const learnedDocuments = documents?.filter((doc: any) => doc.url === 'internal') || [];
    const totalChunks = documents?.reduce((acc: number, doc: any) => acc + (doc._count?.chunks || 0), 0) || 0;

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(apiUrl(`/api/knowledge-base?id=${id}`), {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete document');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Document deleted');
            queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] });
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">AI Knowledge Base</h2>
                    <p className="text-muted-foreground">
                        Manage documents that the AI Assistant uses for suggestions.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] })}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <div className="relative">
                        <Input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            accept=".pdf,.txt,.md"
                            multiple
                            disabled={isUploading}
                        />
                        <Button disabled={isUploading}>
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4 mr-2" />
                            )}
                            {isUploading && uploadProgress
                                ? `Importing...`
                                : 'Upload Documents'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{fileDocuments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Learned Facts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{learnedDocuments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalChunks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {documents?.filter((d: any) => d.status === 'READY').length || 0} Active
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Knowledge Explorer</CardTitle>
                    <CardDescription>
                        Explore uploaded documents and AI-synthesized knowledge from conversations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="files" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="files" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Uploaded Files
                                <Badge variant="secondary" className="ml-2">{fileDocuments.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="learned" className="gap-2">
                                <Bot className="h-4 w-4" />
                                Automated Learning
                                <Badge variant="secondary" className="ml-2 text-blue-600">{learnedDocuments.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="files" className="space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : fileDocuments.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                                    <Database className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No documents found.</p>
                                    <p className="text-sm">Upload PDF, TXT, or MD files to get started.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {isUploading && uploadProgress && (
                                        <div className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/50 border-primary/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                    <div>
                                                        <h4 className="font-semibold text-sm">Importing {uploadProgress.filename}</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            File {uploadProgress.current} of {uploadProgress.total} ({Math.round(uploadProgress.percent)}%)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Progress value={uploadProgress.percent} className="h-2" />
                                        </div>
                                    )}
                                    {fileDocuments.map((doc: any) => (
                                        <DocumentRow
                                            key={doc.id}
                                            doc={doc}
                                            onView={() => handleViewDoc(doc)}
                                            onDelete={() => deleteMutation.mutate(doc.id)}
                                            statusColor={statusColor}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="learned" className="space-y-4">
                            {learnedDocuments.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                                    <Bot className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No automated learning data yet.</p>
                                    <p className="text-sm">Conversations will be synthesized and indexed here daily.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {learnedDocuments.map((doc: any) => (
                                        <DocumentRow
                                            key={doc.id}
                                            doc={doc}
                                            isLearned
                                            onView={() => handleViewDoc(doc)}
                                            onDelete={() => deleteMutation.mutate(doc.id)}
                                            statusColor={statusColor}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Content Viewer Sheet */}
            <Sheet open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
                <SheetContent side="right" className="sm:max-w-xl">
                    <SheetHeader className="pb-4">
                        <div className="flex items-center gap-2 mb-2">
                            {viewingDoc?.url === 'internal' ? <Bot className="h-5 w-5 text-blue-600" /> : <FileText className="h-5 w-5" />}
                            <SheetTitle className="text-xl">{viewingDoc?.title}</SheetTitle>
                        </div>
                        <SheetDescription>
                            {viewingDoc?.url === 'internal'
                                ? 'AI-synthesized knowledge from Telegram conversations.'
                                : `Uploaded on ${viewingDoc && new Date(viewingDoc.createdAt).toLocaleDateString()}`}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-4 border rounded-lg bg-muted/30 h-[calc(100vh-180px)]">
                        {isLoadingDoc ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ScrollArea className="h-full p-6">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    {docContent ? (
                                        docContent.split('\n').map((line, i) => (
                                            <p key={i} className="mb-4 text-sm leading-relaxed">
                                                {line}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground italic">No content available.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function DocumentRow({ doc, onView, onDelete, statusColor, isLearned = false }: any) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors cursor-pointer group" onClick={onView}>
            <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded group-hover:bg-background transition-colors">
                    {isLearned ? (
                        <Bot className="h-6 w-6 text-blue-600" />
                    ) : doc.fileType?.includes('pdf') ? (
                        <FileText className="h-6 w-6 text-red-500" />
                    ) : (
                        <File className="h-6 w-6 text-blue-500" />
                    )}
                </div>
                <div>
                    <h4 className="font-semibold">{doc.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {!isLearned && <span>{formatBytes(doc.fileSize)}</span>}
                        {!isLearned && <span>•</span>}
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <Badge variant="outline" className={`${statusColor(doc.status)} text-white border-0 text-[10px] h-5`}>
                            {doc.status}
                        </Badge>
                        {doc.status === 'READY' && (
                            <span>({doc._count?.chunks || 0} chunks)</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={onView}>View</Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this document?')) {
                            onDelete();
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
