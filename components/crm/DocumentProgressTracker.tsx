'use client';

/**
 * DocumentProgressTracker
 *
 * Shows required documents for a lead with upload/missing/expired status,
 * an overall completion percentage bar, and upload buttons for each
 * missing document. Integrates with the existing LeadDocument model.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, Circle, AlertTriangle, Upload,
  FileText, Loader2, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';

export interface RequiredDocument {
  type: string;
  label: string;
  required: boolean;
}

interface UploadedDoc {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  expirationDate: string | null;
  uploadedAt: string;
}

type DocStatus = 'uploaded' | 'missing' | 'expired';

interface DocEntry {
  type: string;
  label: string;
  required: boolean;
  status: DocStatus;
  document?: UploadedDoc;
}

const DEFAULT_REQUIRED_DOCUMENTS: RequiredDocument[] = [
  { type: 'CDL_LICENSE', label: 'CDL Copy', required: true },
  { type: 'MEDICAL_CARD', label: 'Medical Card', required: true },
  { type: 'MVR', label: 'MVR Report', required: true },
  { type: 'DRUG_TEST', label: 'Drug Test Results', required: true },
  { type: 'EMPLOYMENT_HISTORY', label: 'Employment History', required: true },
  { type: 'SSN_VERIFICATION', label: 'SSN Verification', required: false },
  { type: 'W9', label: 'W-9 Form', required: false },
];

interface DocumentProgressTrackerProps {
  leadId: string;
  requiredDocuments?: RequiredDocument[];
}

export default function DocumentProgressTracker({
  leadId,
  requiredDocuments = DEFAULT_REQUIRED_DOCUMENTS,
}: DocumentProgressTrackerProps) {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/documents`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setUploadedDocs(json.data ?? []);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) fetchDocs();
  }, [leadId, fetchDocs]);

  // Build entries with status
  const entries: DocEntry[] = requiredDocuments.map((req) => {
    const doc = uploadedDocs.find((d) => d.documentType === req.type);
    let status: DocStatus = 'missing';
    if (doc) {
      const isExpired = doc.expirationDate && isPast(new Date(doc.expirationDate));
      status = isExpired ? 'expired' : 'uploaded';
    }
    return { ...req, status, document: doc };
  });

  const uploadedCount = entries.filter((e) => e.status === 'uploaded').length;
  const totalCount = entries.length;
  const requiredUploaded = entries.filter(
    (e) => e.required && e.status === 'uploaded'
  ).length;
  const requiredTotal = entries.filter((e) => e.required).length;
  const pct = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;

  const handleUpload = async (docType: string, file: File) => {
    setUploadingType(docType);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);

    try {
      const res = await fetch(`/api/crm/leads/${leadId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      toast.success('Document uploaded');
      fetchDocs();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Document Checklist</CardTitle>
          <div className="text-sm text-muted-foreground">
            {uploadedCount}/{totalCount} uploaded
            {requiredTotal > 0 && (
              <span className="ml-2">
                ({requiredUploaded}/{requiredTotal} required)
              </span>
            )}
          </div>
        </div>
        <Progress value={pct} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">{pct}% complete</p>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {entries.map((entry) => (
          <DocRow
            key={entry.type}
            entry={entry}
            uploading={uploadingType === entry.type}
            onUpload={(file) => handleUpload(entry.type, file)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function DocRow({
  entry,
  uploading,
  onUpload,
}: {
  entry: DocEntry;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
      <div className="flex items-center gap-3">
        <StatusIcon status={entry.status} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{entry.label}</span>
            {entry.required && (
              <span className="text-[10px] text-red-500 font-medium">*</span>
            )}
          </div>
          {entry.document && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{entry.document.fileName}</span>
              {entry.document.expirationDate && (
                <span className="flex items-center gap-0.5">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(entry.document.expirationDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={entry.status} />
        {entry.status !== 'uploaded' && (
          <label className="cursor-pointer">
            <Input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs pointer-events-none"
              asChild
            >
              <span>
                {uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </>
                )}
              </span>
            </Button>
          </label>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: DocStatus }) {
  switch (status) {
    case 'uploaded':
      return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />;
    case 'expired':
      return <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground shrink-0" />;
  }
}

function StatusBadge({ status }: { status: DocStatus }) {
  const styles: Record<DocStatus, string> = {
    uploaded: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    expired: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    missing: 'bg-muted text-muted-foreground',
  };
  const labels: Record<DocStatus, string> = {
    uploaded: 'Uploaded',
    expired: 'Expired',
    missing: 'Missing',
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status]}`}>
      {labels[status]}
    </Badge>
  );
}
