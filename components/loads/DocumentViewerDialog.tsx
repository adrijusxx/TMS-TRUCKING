'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Document {
  id: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
}

interface DocumentViewerDialogProps {
  documents: Document[];
  loadNumber: string;
}

const documentTypeLabels: Record<string, string> = {
  RATE_CONFIRMATION: 'Rate Confirmation',
  BOL: 'Bill of Lading',
  POD: 'Proof of Delivery',
  INVOICE: 'Invoice',
  RECEIPT: 'Receipt',
  PERMIT: 'Permit',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
};

export default function DocumentViewerDialog({ documents, loadNumber }: DocumentViewerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documents - {loadNumber}</DialogTitle>
          <DialogDescription>
            View and download documents for this load
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {documents.map((doc) => (
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
                      {documentTypeLabels[doc.type] || doc.type}
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
                  title="View in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
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
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
