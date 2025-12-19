'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, FileText, X, Check, Trash2, ExternalLink } from 'lucide-react';
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

interface WorkOrderImporterProps {
  breakdownId: string;
  onImportSuccess?: (data: any) => void;
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

async function fetchDocuments(breakdownId: string) {
  const response = await fetch(apiUrl(`/api/breakdowns/${breakdownId}/documents?type=WORK_ORDER`));
  if (!response.ok) throw new Error('Failed to fetch documents');
  return response.json();
}

async function parseWorkOrder(file: File, breakdownId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('breakdownId', breakdownId);

  const response = await fetch(apiUrl('/api/breakdowns/parse-work-order'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to parse work order');
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

export default function WorkOrderImporter({ breakdownId, onImportSuccess }: WorkOrderImporterProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: documentsData } = useQuery({
    queryKey: ['breakdown-documents', breakdownId, 'WORK_ORDER'],
    queryFn: () => fetchDocuments(breakdownId),
  });

  const documents = documentsData?.data?.documents || [];

  const parseMutation = useMutation({
    mutationFn: (file: File) => parseWorkOrder(file, breakdownId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['breakdown', breakdownId] });
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-compact'] });
      queryClient.invalidateQueries({ queryKey: ['breakdown-documents', breakdownId, 'WORK_ORDER'] });
      toast.success('Work order uploaded and parsed successfully');
      if (onImportSuccess) onImportSuccess(data.data);
      setSelectedFile(null);
      setPreview(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdown-documents', breakdownId, 'WORK_ORDER'] });
      toast.success('Document deleted');
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPEG, or PDF file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    parseMutation.mutate(selectedFile);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Upload Work Order / Invoice</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/png,image/jpeg,image/jpg,application/pdf"
            onChange={handleFileChange}
            disabled={parseMutation.isPending}
            className="h-9 text-xs"
          />
          {selectedFile && !parseMutation.isPending && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload PNG, JPEG, or PDF. AI will extract costs, service provider, and other details.
        </p>
      </div>

      {selectedFile && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {preview ? (
                <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center bg-muted rounded border">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={handleImport}
                  disabled={parseMutation.isPending}
                >
                  {parseMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Import & Parse
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {parseMutation.isSuccess && (
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-700 dark:text-green-300">
            Work order imported successfully. Cost fields have been populated.
          </span>
        </div>
      )}

      {/* Existing Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Uploaded Work Orders</Label>
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
            <AlertDialogTitle>Delete Work Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this work order document. This action cannot be undone.
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

