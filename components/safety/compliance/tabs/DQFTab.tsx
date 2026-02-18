'use client';

import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiUrl, formatDate } from '@/lib/utils';
import { DriverComplianceData } from '@/types/compliance';
import {
  getStatusBadgeColor,
  formatDaysUntilExpiration,
  isExpired,
  isExpiringSoon,
  daysUntilExpiration,
} from '@/lib/utils/compliance-status';
import { toast } from 'sonner';
import { Upload, Download, Trash2 } from 'lucide-react';

export const REQUIRED_DOCUMENTS = [
  { type: 'APPLICATION', label: 'Application for Employment' },
  { type: 'ROAD_TEST', label: 'Road Test Certificate' },
  { type: 'PREVIOUS_EMPLOYMENT_VERIFICATION', label: 'Previous Employment Verification' },
  { type: 'ANNUAL_REVIEW', label: 'Annual Review' },
  { type: 'MEDICAL_EXAMINERS_CERTIFICATE', label: "Medical Examiner's Certificate" },
  { type: 'CDL_COPY', label: 'CDL Copy' },
  { type: 'MVR_RECORD', label: 'MVR Record' },
  { type: 'DRUG_TEST_RESULT', label: 'Drug Test Result' },
  { type: 'ALCOHOL_TEST_RESULT', label: 'Alcohol Test Result' },
  { type: 'TRAINING_CERTIFICATE', label: 'Training Certificate' },
];

interface DQFTabProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
}

export default function DQFTab({ driver, onSave }: DQFTabProps) {
  const queryClient = useQueryClient();
  const documentsByType = driver.dqf?.documents.reduce((acc: any, doc) => {
    acc[doc.documentType] = doc;
    return acc;
  }, {}) || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>DQF Documents</CardTitle>
        <CardDescription>Upload files and manage Driver Qualification File documents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {REQUIRED_DOCUMENTS.map((required) => {
            const dqfDocument = documentsByType[required.type];
            return (
              <DQFDocumentItem
                key={required.type}
                driverId={driver.driverId}
                documentType={required.type}
                label={required.label}
                dqfDocument={dqfDocument}
                onUpdate={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
                  await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
                  await onSave();
                }}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DQFDocumentItem({
  driverId,
  documentType,
  label,
  dqfDocument,
  onUpdate,
}: {
  driverId: string;
  documentType: string;
  label: string;
  dqfDocument?: any;
  onUpdate: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [issueDate, setIssueDate] = useState(
    dqfDocument?.issueDate ? new Date(dqfDocument.issueDate).toISOString().split('T')[0] : ''
  );
  const [expirationDate, setExpirationDate] = useState(
    dqfDocument?.expirationDate ? new Date(dqfDocument.expirationDate).toISOString().split('T')[0] : ''
  );

  const calculateStatus = (expDate: string | null, hasDoc: boolean): 'COMPLETE' | 'MISSING' | 'EXPIRING' | 'EXPIRED' => {
    if (!hasDoc) return 'MISSING';
    if (!expDate || expDate.trim() === '') return 'COMPLETE';
    try {
      const expiration = new Date(expDate);
      if (isNaN(expiration.getTime())) return 'COMPLETE';
      if (isExpired(expiration)) return 'EXPIRED';
      if (isExpiringSoon(expiration)) return 'EXPIRING';
      return 'COMPLETE';
    } catch {
      return 'COMPLETE';
    }
  };

  const [status, setStatus] = useState(() =>
    calculateStatus(
      dqfDocument?.expirationDate ? new Date(dqfDocument.expirationDate).toISOString().split('T')[0] : null,
      !!dqfDocument?.document
    )
  );

  useEffect(() => {
    if (dqfDocument) {
      const expDate = dqfDocument.expirationDate ? new Date(dqfDocument.expirationDate).toISOString().split('T')[0] : '';
      setIssueDate(dqfDocument.issueDate ? new Date(dqfDocument.issueDate).toISOString().split('T')[0] : '');
      setExpirationDate(expDate);
      setStatus(calculateStatus(expDate, !!dqfDocument.document));
    } else {
      setIssueDate('');
      setExpirationDate('');
      setStatus('MISSING');
    }
    setSelectedFile(null);
  }, [dqfDocument]);

  useEffect(() => {
    if (expirationDate || dqfDocument?.document) {
      setStatus(calculateStatus(expirationDate, !!dqfDocument?.document || !!selectedFile));
    }
  }, [expirationDate, dqfDocument?.document, selectedFile]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'OTHER');
      formData.append('fileName', file.name);
      formData.append('title', `${label} - ${file.name}`);
      formData.append('fileUrl', `/uploads/${Date.now()}-${file.name}`);
      formData.append('fileSize', file.size.toString());
      formData.append('mimeType', file.type || 'application/octet-stream');
      formData.append('driverId', driverId);
      formData.append('description', `DQF Document: ${label}`);

      const uploadResponse = await fetch(apiUrl('/api/documents/upload'), {
        method: 'POST',
        body: formData,
      });
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error?.message || 'Failed to upload file');
      }
      const { data: document } = await uploadResponse.json();

      const dqfResponse = await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          documentType,
          issueDate: issueDate || null,
          expirationDate: expirationDate || null,
          status,
        }),
      });
      if (!dqfResponse.ok) throw new Error('Failed to link document to DQF');

      toast.success(`${label} uploaded successfully`);
      setShowUploadForm(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dqf', driverId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      await onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateDates = async () => {
    const documentId = dqfDocument?.documentId || dqfDocument?.document?.id;
    if (!documentId) {
      toast.error('Please upload a document first');
      return;
    }
    const calculatedStatus = calculateStatus(expirationDate, !!dqfDocument?.document || true);
    try {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          documentType,
          issueDate: issueDate || null,
          expirationDate: expirationDate || null,
          status: calculatedStatus,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error?.message || errorData.error || 'Failed to update dates');
      }
      setStatus(calculatedStatus);
      toast.success('Dates updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dqf', driverId] });
      await onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update dates');
    }
  };

  const handleDeleteDocument = async () => {
    const documentId = dqfDocument?.documentId || dqfDocument?.document?.id;
    if (!documentId) {
      toast.error('No document to delete');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${dqfDocument.document?.fileName || 'this document'}"? This action cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const deleteResponse = await fetch(apiUrl(`/api/documents/${documentId}`), { method: 'DELETE' });
      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        throw new Error(error.error?.message || 'Failed to delete document');
      }
      try {
        await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId,
            documentType,
            status: 'MISSING',
            issueDate: issueDate || null,
            expirationDate: expirationDate || null,
          }),
        });
      } catch { /* continue even if DQF update fails */ }

      toast.success('Document deleted successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dqf', driverId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      await onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentStatus = status !== 'MISSING' || dqfDocument?.document ? status : (dqfDocument?.status || 'MISSING');
  const hasDocument = !!dqfDocument?.document || !!selectedFile;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={getStatusBadgeColor(currentStatus)}>{currentStatus}</Badge>
          <div>
            <div className="font-medium">{label}</div>
            {dqfDocument?.expirationDate && (
              <div className="text-sm text-muted-foreground">Expires: {formatDate(dqfDocument.expirationDate)}</div>
            )}
            {dqfDocument?.issueDate && (
              <div className="text-sm text-muted-foreground">Issued: {formatDate(dqfDocument.issueDate)}</div>
            )}
            {hasDocument && dqfDocument?.document && (
              <div className="text-sm text-primary mt-1 flex items-center gap-2">
                <a href={dqfDocument.document.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                  <Download className="h-3 w-3" />
                  {dqfDocument.document.fileName}
                </a>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDeleteDocument} disabled={isDeleting} title="Delete document">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <Button size="sm" variant={hasDocument ? 'outline' : 'default'} onClick={() => setShowUploadForm(!showUploadForm)}>
          <Upload className="h-4 w-4 mr-2" />
          {hasDocument ? 'Update' : 'Upload'}
        </Button>
      </div>

      {showUploadForm && (
        <div className="border-t pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Issue Date</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <Label>Expiration Date</Label>
              <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Status (Auto-calculated)</Label>
            <div className="flex items-center gap-2">
              <Badge className={getStatusBadgeColor(status)}>{status}</Badge>
              {expirationDate && (
                <span className="text-sm text-muted-foreground">
                  {formatDaysUntilExpiration(daysUntilExpiration(new Date(expirationDate)))}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Status is automatically calculated based on expiration date</p>
          </div>
          <div>
            <Label>File</Label>
            <div className="flex gap-2">
              <Input ref={fileInputRef} type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={isUploading} className="flex-1" />
              {selectedFile && <span className="text-sm text-muted-foreground self-center">{selectedFile.name}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {selectedFile && (
              <Button size="sm" onClick={() => handleFileUpload(selectedFile)} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : hasDocument ? 'Replace File' : 'Upload File'}
              </Button>
            )}
            {hasDocument && (
              <Button size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateDates(); }} disabled={isUploading || !!selectedFile} type="button">
                Update Dates & Status
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => { setShowUploadForm(false); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={isUploading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
