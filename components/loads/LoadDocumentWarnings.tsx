'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Upload, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiUrl } from '@/lib/utils';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';

interface LoadDocumentWarningsProps {
  loadId: string;
  loadNumber: string;
}

interface Document {
  id: string;
  type: string;
  fileName: string;
  createdAt: string;
}

async function fetchLoadDocuments(loadId: string) {
  const response = await fetch(apiUrl(`/api/documents?loadId=${loadId}&limit=100`));
  if (!response.ok) throw new Error('Failed to fetch documents');
  const result = await response.json();
  return result.data || [];
}

const REQUIRED_DOCUMENTS = ['BOL', 'POD'] as const;
const documentLabels: Record<string, string> = {
  BOL: 'Bill of Lading',
  POD: 'Proof of Delivery',
  RATE_CONFIRMATION: 'Rate Confirmation',
};

export default function LoadDocumentWarnings({ loadId, loadNumber }: LoadDocumentWarningsProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState<string>('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', loadId],
    queryFn: () => fetchLoadDocuments(loadId),
  });

  const documentTypes = documents.map((doc: Document) => doc.type);
  const missingDocuments = REQUIRED_DOCUMENTS.filter((type) => !documentTypes.includes(type));
  const hasMissingDocuments = missingDocuments.length > 0;

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', loadId] });
    queryClient.invalidateQueries({ queryKey: ['loads'] });
    queryClient.invalidateQueries({ queryKey: ['load', loadId] });
    setShowUpload(false);
    setUploadType('');
    toast.success('Document uploaded successfully');
  };

  const handleDelete = async (documentId: string, documentType: string) => {
    if (!confirm(`Are you sure you want to delete this ${documentLabels[documentType] || documentType}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/documents/${documentId}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete document');
      }

      queryClient.invalidateQueries({ queryKey: ['documents', loadId] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    }
  };

  // Check if user can delete a specific document
  const canDeleteDocument = (docType: string) => {
    const isDispatcher = session?.user?.role === 'DISPATCHER';
    const isCriticalDoc = ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(docType);
    return isDispatcher ? isCriticalDoc : can('documents.delete');
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading document status...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Document Status</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowUpload(!showUpload);
            if (showUpload) setUploadType('');
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          {showUpload ? 'Cancel Upload' : 'Upload Document'}
        </Button>
      </div>

      {showUpload && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              loadId={loadId}
              onSuccess={handleUploadSuccess}
              defaultType={uploadType}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {/* Required Documents */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Required Documents</div>
          {REQUIRED_DOCUMENTS.map((type) => {
            const hasDocument = documentTypes.includes(type);
            const document = documents.find((doc: Document) => doc.type === type);
            const canDelete = hasDocument && canDeleteDocument(type);
            
            return (
              <div
                key={type}
                className="flex items-center justify-between p-2 rounded-md border"
                style={{
                  backgroundColor: hasDocument ? 'rgb(240 253 244)' : 'rgb(254 242 242)',
                  borderColor: hasDocument ? 'rgb(187 247 208)' : 'rgb(254 202 202)',
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {hasDocument ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">{documentLabels[type]}</span>
                  {hasDocument && document && (
                    <span className="text-xs text-muted-foreground truncate" title={document.fileName}>
                      {document.fileName}
                    </span>
                  )}
                  {hasDocument && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 flex-shrink-0">
                      Uploaded
                    </Badge>
                  )}
                  {!hasDocument && (
                    <Badge variant="destructive" className="text-xs flex-shrink-0">
                      Missing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!hasDocument && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setShowUpload(true);
                        setUploadType(type);
                      }}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  )}
                  {canDelete && document && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(document.id, type)}
                      title={`Delete ${documentLabels[type]}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Other Documents (including RATE_CONFIRMATION) */}
        {documents.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs font-medium text-muted-foreground">Other Documents</div>
            <div className="space-y-1">
              {documents
                .filter((doc: Document) => !REQUIRED_DOCUMENTS.includes(doc.type as any))
                .map((doc: Document) => {
                  const canDelete = canDeleteDocument(doc.type);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate" title={doc.fileName}>{doc.fileName}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {doc.type}
                        </Badge>
                      </div>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => handleDelete(doc.id, doc.type)}
                          title={`Delete ${doc.type}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {hasMissingDocuments && (
        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-yellow-800">
                Missing Required Documents
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Please upload {missingDocuments.map((type) => documentLabels[type]).join(' and ')} to complete this load.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

