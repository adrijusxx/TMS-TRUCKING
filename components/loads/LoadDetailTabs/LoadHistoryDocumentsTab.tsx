'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  History,
  FileText,
  Upload,
  Trash2,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { LoadStatus } from '@prisma/client';
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

interface LoadHistoryDocumentsTabProps {
  load: any;
}

const statusColors: Record<LoadStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_PICKUP: 'bg-orange-100 text-orange-800 border-orange-200',
  LOADED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  AT_DELIVERY: 'bg-pink-100 text-pink-800 border-pink-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  BILLING_HOLD: 'bg-amber-100 text-amber-800 border-amber-200',
  READY_TO_BILL: 'bg-lime-100 text-lime-800 border-lime-200',
  INVOICED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PAID: 'bg-teal-100 text-teal-800 border-teal-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
    <div className="space-y-4">
      {/* Status History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              Status History ({load.statusHistory?.length || 0})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {load.statusHistory && load.statusHistory.length > 0 ? (
            <div className="space-y-3">
              {load.statusHistory.map((history: any) => (
                <div
                  key={history.id}
                  className="flex items-start gap-4 p-3 border rounded-lg"
                >
                  <Badge
                    variant="outline"
                    className={statusColors[history.status as LoadStatus]}
                  >
                    {formatStatus(history.status)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(history.createdAt)}
                    </p>
                    {history.notes && (
                      <p className="text-sm mt-1">{history.notes}</p>
                    )}
                    {history.location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Location: {history.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No status history available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">
                Documents ({load.documents?.length || 0})
              </CardTitle>
            </div>
            {can('documents.upload') && (
              <DocumentUpload
                loadId={load.id}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['load', load.id] });
                  router.refresh();
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {load.documents && load.documents.length > 0 ? (
            <div className="space-y-3">
              {load.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{doc.title || doc.fileName}</p>
                        <Badge variant="outline" className="text-xs">
                          {doc.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{doc.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      className="h-8 text-xs"
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
                      className="h-8 text-xs"
                    >
                      Download
                    </Button>
                    {(() => {
                      const isDispatcher = session?.user?.role === 'DISPATCHER';
                      const isCriticalDoc = ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(doc.type);
                      const canDelete = isDispatcher
                        ? isCriticalDoc
                        : can('documents.delete');

                      return canDelete ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocumentToDelete(doc.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title={
                            isDispatcher && !isCriticalDoc
                              ? 'Dispatchers can only delete BOL, POD, and Rate Confirmation documents'
                              : 'Delete document'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents attached to this load</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Tracking Timestamps */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Status Tracking</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {load.assignedAt && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-muted-foreground">Assigned At</Label>
                  <p className="font-medium text-sm mt-0.5">
                    {formatDateTime(load.assignedAt)}
                  </p>
                </div>
              </div>
            )}

            {load.pickedUpAt && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-muted-foreground">Picked Up At</Label>
                  <p className="font-medium text-sm mt-0.5">
                    {formatDateTime(load.pickedUpAt)}
                  </p>
                </div>
              </div>
            )}

            {load.deliveredAt && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-muted-foreground">Delivered At</Label>
                  <p className="font-medium text-sm mt-0.5">
                    {formatDateTime(load.deliveredAt)}
                  </p>
                </div>
              </div>
            )}

            {load.invoicedAt && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-muted-foreground">Invoiced At</Label>
                  <p className="font-medium text-sm mt-0.5">
                    {formatDateTime(load.invoicedAt)}
                  </p>
                </div>
              </div>
            )}

            {load.paidAt && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-muted-foreground">Paid At</Label>
                  <p className="font-medium text-sm mt-0.5">
                    {formatDateTime(load.paidAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* EDI Tracking */}
      {(load.ediSent || load.ediReceived || load.ediTransactionId) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">EDI Tracking</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2">
                {load.ediSent ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <Label className="text-sm">EDI Sent</Label>
              </div>

              <div className="flex items-center gap-2">
                {load.ediReceived ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <Label className="text-sm">EDI Received</Label>
              </div>

              {load.ediTransactionId && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Transaction ID</Label>
                  <p className="font-medium text-sm mt-0.5">{load.ediTransactionId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Document Confirmation Dialog */}
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
                if (documentToDelete) {
                  deleteDocumentMutation.mutate(documentToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

