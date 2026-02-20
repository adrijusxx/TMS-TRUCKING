'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { FileIcon, Loader2, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Document {
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    notes: string | null;
    uploadedAt: string;
    uploadedBy: {
        firstName: string;
        lastName: string;
    };
}

const DOCUMENT_TYPES = [
    { value: 'CDL_LICENSE', label: 'CDL License' },
    { value: 'MEDICAL_CARD', label: 'Medical Card' },
    { value: 'MVR', label: 'MVR Report' },
    { value: 'APPLICATION', label: 'Application' },
    { value: 'RESUME', label: 'Resume' },
    { value: 'OTHER', label: 'Other' },
];

export default function LeadDocuments({ leadId }: { leadId: string }) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Upload Form State
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('OTHER');
    const [notes, setNotes] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/documents`);
            if (!res.ok) throw new Error('Failed to fetch documents');
            const data = await res.json();
            setDocuments(data.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (leadId) fetchDocuments();
    }, [leadId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', docType);
        formData.append('notes', notes);

        try {
            const res = await fetch(`/api/crm/leads/${leadId}/documents`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Upload failed');
            }

            toast.success('Document uploaded successfully');
            setFile(null);
            setNotes('');
            setDocType('OTHER');
            // Reset input
            const input = document.getElementById('file-upload') as HTMLInputElement;
            if (input) input.value = '';

            fetchDocuments();
        } catch (error: any) {
            toast.error(error.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/documents?documentId=${deleteId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Document deleted');
            setDeleteId(null);
            fetchDocuments();
        } catch {
            toast.error('Failed to delete document');
        }
    };

    function formatFileSize(bytes: number) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleUpload} className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="doc-type">Document Type</Label>
                                <Select value={docType} onValueChange={setDocType}>
                                    <SelectTrigger id="doc-type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DOCUMENT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file-upload">File</Label>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional details..."
                                className="h-20"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={!file || uploading}>
                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload Document
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                    {documents.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No documents uploaded</p>
                    ) : (
                        documents.map((doc) => (
                            <div key={doc.id} className="flex items-start justify-between p-3 border rounded-md bg-card">
                                <div className="flex items-start gap-3">
                                    <div className="bg-muted p-2 rounded-md">
                                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">{doc.fileName}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <span className="font-semibold">{DOCUMENT_TYPES.find(d => d.value === doc.documentType)?.label || doc.documentType}</span>
                                            <span>•</span>
                                            <span>{formatFileSize(doc.fileSize)}</span>
                                            <span>•</span>
                                            <span>{format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</span>
                                        </div>
                                        {doc.notes && <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(doc.id)}
                                        className="text-muted-foreground hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this document? This action cannot be undone.
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
