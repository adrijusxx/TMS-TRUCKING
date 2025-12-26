'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Trash2, Database, RefreshCw, File } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';

export default function KnowledgeBaseManager() {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const { data: documents, isLoading } = useQuery({
        queryKey: ['knowledge-base-docs'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/knowledge-base'));
            if (!res.ok) throw new Error('Failed to fetch documents');
            const data = await res.json();
            return data.data || [];
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(apiUrl('/api/knowledge-base/upload'), {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Document uploaded and processing started');
            queryClient.invalidateQueries({ queryKey: ['knowledge-base-docs'] });
            setIsUploading(false);
        },
        onError: (err: Error) => {
            toast.error(err.message);
            setIsUploading(false);
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        if (!['application/pdf', 'text/plain'].includes(file.type)) {
            toast.error('Only PDF and TXT files are supported');
            return;
        }

        setIsUploading(true);
        uploadMutation.mutate(file);
        // Reset input
        e.target.value = '';
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'READY': return 'bg-green-500';
            case 'PROCESSING': return 'bg-yellow-500';
            case 'FAILED': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

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
                            accept=".pdf,.txt"
                            disabled={isUploading}
                        />
                        <Button disabled={isUploading}>
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload Document
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{documents?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {documents?.reduce((acc: number, doc: any) => acc + (doc._count?.chunks || 0), 0) || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Synced Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {documents?.filter((d: any) => d.status === 'READY').length || 0} Ready
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                        PDF manuals, policies, and repair guides uploaded for AI reference.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : documents?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                            <Database className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No documents found.</p>
                            <p className="text-sm">Upload a PDF or Text file to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {documents?.map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-muted rounded">
                                            {doc.fileType?.includes('pdf') ? (
                                                <FileText className="h-6 w-6 text-red-500" />
                                            ) : (
                                                <File className="h-6 w-6 text-blue-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{doc.title}</h4>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>{formatBytes(doc.fileSize)}</span>
                                                <span>•</span>
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
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
