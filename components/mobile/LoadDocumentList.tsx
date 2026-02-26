'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Image, File, ExternalLink } from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import DocumentUpload from './DocumentUpload';

interface LoadDocument {
  id: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string;
}

interface LoadDocumentListProps {
  loadId: string;
}

const typeLabels: Record<string, string> = {
  POD: 'Proof of Delivery',
  BOL: 'Bill of Lading',
  RATE_CONFIRMATION: 'Rate Confirmation',
  LUMPER: 'Lumper Receipt',
  DETENTION: 'Detention Receipt',
  INVOICE: 'Invoice',
  OTHER: 'Other',
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  return FileText;
}

export default function LoadDocumentList({ loadId }: LoadDocumentListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['load-documents', loadId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/mobile/loads/${loadId}/documents`));
      if (!response.ok) return { data: [] };
      return response.json();
    },
  });

  const documents: LoadDocument[] = data?.data || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-2">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No documents yet</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.mimeType);
              return (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[doc.type] || doc.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </a>
              );
            })}
          </div>
        )}

        <DocumentUpload loadId={loadId} />
      </CardContent>
    </Card>
  );
}
