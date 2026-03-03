'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from 'next-auth/react';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
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
import { useRouter } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface LoadHistoryDocumentsTabProps {
  load: any;
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

export default function LoadHistoryDocumentsTab({ load }: LoadHistoryDocumentsTabProps) {
  const { can } = usePermissions();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load', load.id] });
      toast.success('Document deleted successfully');
      setDocumentToDelete(null);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });

  return (
    <Card>
      <CardHeader className="py-2.5 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              Documents ({load.documents?.length || 0})
            </CardTitle>
          </div>
          {can('documents.upload') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Upload
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-2">
        {/* Compact Upload Form */}
        {showUpload && can('documents.upload') && (
          <DocumentUpload
            loadId={load.id}
            compact
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['load', load.id] });
              router.refresh();
              setShowUpload(false);
            }}
          />
        )}

        {/* Document List */}
        {load.documents && load.documents.length > 0 ? (
          <div className="space-y-1.5">
            {load.documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{doc.title || doc.fileName}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                    {doc.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                    className="h-6 text-[10px] px-1.5"
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = doc.fileUrl;
                      link.download = doc.fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="h-6 text-[10px] px-1.5"
                  >
                    DL
                  </Button>
                  {(() => {
                    const isDispatcher = session?.user?.role === 'DISPATCHER';
                    const isCriticalDoc = ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(doc.type);
                    const canDelete = isDispatcher ? isCriticalDoc : can('documents.delete');
                    return canDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDocumentToDelete(doc.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            No documents attached
          </p>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDelete) deleteDocumentMutation.mutate(documentToDelete);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
