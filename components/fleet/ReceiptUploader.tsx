'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, FileText, Trash2, ExternalLink, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
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

interface ReceiptUploaderProps {
  breakdownId: string;
  documentType?: 'RECEIPT' | 'INVOICE';
}

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  type: string;
  createdAt: string;
}

async function fetchDocuments(breakdownId: string, type: string) {
  const response = await fetch(apiUrl(`/api/breakdowns/${breakdownId}/documents?type=${type}`));
  if (!response.ok) throw new Error('Failed to fetch documents');
  return response.json();
}

async function uploadDocument(file: File, breakdownId: string, type: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('breakdownId', breakdownId);
  formData.append('type', type);

  const response = await fetch(apiUrl('/api/documents/upload'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload document');
  }

  return response.json();
}

async function deleteDocument(documentId: string) {
  const response = await fetch(apiUrl(`/api/documents/${documentId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete document');
  }
  return response.json();
}

export default function ReceiptUploader({ breakdownId, documentType = 'RECEIPT' }: ReceiptUploaderProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: documentsData } = useQuery({
    queryKey: ['breakdown-documents', breakdownId, documentType],
    queryFn: () => fetchDocuments(breakdownId, documentType),
  });

  const documents = documentsData?.data?.documents || [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(file, breakdownId, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdown-documents', breakdownId, documentType] });
      toast.success(`${documentType === 'RECEIPT' ? 'Receipt' : 'Invoice'} uploaded successfully`);
      setSelectedFile(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdown-documents', breakdownId, documentType] });
      toast.success('Document deleted');
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-md flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Upload {documentType === 'RECEIPT' ? 'Receipt' : 'Invoice'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Select File</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
                className="h-9 text-xs"
              />
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports PNG, JPEG, and PDF files (max 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            Uploaded {documentType === 'RECEIPT' ? 'Receipts' : 'Invoices'} ({documents.length})
          </Label>
          <div className="space-y-2">
            {documents.map((doc: Document) => (
              <Card key={doc.id}>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{doc.title || doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {documentType.toLowerCase()}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}











