'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  { type: 'CDL_COPY', label: 'CDL Copy' },
  { type: 'SSN_COPY', label: 'SSN Copy' },
  { type: 'MVR_RECORD', label: 'MVR Record' },
  { type: 'PSP_RECORD', label: 'PSP Record' },
  { type: 'APPLICATION', label: 'Application / Contract' },
];

interface DQFTabProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
}

export default function DQFTab({ driver, onSave }: DQFTabProps) {
  const queryClient = useQueryClient();
  const [showNewCustom, setShowNewCustom] = useState(false);
  const [customDocName, setCustomDocName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch company-level custom DQF types
  const { data: companyCustomTypes = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['custom-dqf-types'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/safety/custom-dqf-types'));
      if (!res.ok) return [];
      const data = await res.json();
      return data.types || [];
    },
  });

  const documentsByType = driver.dqf?.documents.reduce((acc: any, doc) => {
    acc[doc.documentType] = doc;
    return acc;
  }, {}) || {};

  // Map custom documents by customName for easy lookup
  const customDocsByName = (driver.dqf?.documents || [])
    .filter((doc: any) => doc.documentType === 'OTHER' && doc.customName)
    .reduce((acc: any, doc: any) => {
      acc[doc.customName] = doc;
      return acc;
    }, {});

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
    await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
    await onSave();
  };

  const handleCreateCustom = async () => {
    const name = customDocName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/safety/custom-dqf-types'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create custom document type');
      }
      toast.success(`Custom document type "${name}" created for company`);
      setShowNewCustom(false);
      setCustomDocName('');
      await queryClient.invalidateQueries({ queryKey: ['custom-dqf-types'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create custom document type');
    } finally {
      setIsCreating(false);
    }
  };

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
                onUpdate={handleRefresh}
              />
            );
          })}

          {/* Company-Level Custom Documents Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Custom Documents</h4>
              <Button size="sm" variant="outline" onClick={() => setShowNewCustom(!showNewCustom)}>
                {showNewCustom ? 'Cancel' : '+ Add Custom Type'}
              </Button>
            </div>
            {showNewCustom && (
              <div className="flex items-center gap-2 mb-3">
                <Input
                  placeholder="Document type name (e.g. Background Check)"
                  value={customDocName}
                  onChange={(e) => setCustomDocName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  disabled={!customDocName.trim() || isCreating}
                  onClick={handleCreateCustom}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            )}
            {companyCustomTypes.map((customType) => (
              <DQFDocumentItem
                key={`custom-${customType.id}`}
                driverId={driver.driverId}
                documentType="OTHER"
                customName={customType.name}
                label={customType.name}
                dqfDocument={customDocsByName[customType.name]}
                onUpdate={handleRefresh}
              />
            ))}
            {companyCustomTypes.length === 0 && !showNewCustom && (
              <p className="text-sm text-muted-foreground">No custom document types defined. Add one to apply it to all drivers.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DQFDocumentItem({
  driverId,
  documentType,
  label,
  customName,
  dqfDocument,
  onUpdate,
}: {
  driverId: string;
  documentType: string;
  label: string;
  customName?: string;
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
      if (!showUploadForm) {
        setIssueDate(dqfDocument.issueDate ? new Date(dqfDocument.issueDate).toISOString().split('T')[0] : '');
        setExpirationDate(expDate);
      }
      setStatus(calculateStatus(expDate, !!dqfDocument.document));
    } else if (!showUploadForm) {
      setIssueDate('');
      setExpirationDate('');
      setStatus('MISSING');
    }
    if (!showUploadForm) setSelectedFile(null);
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
          customName: customName || '',
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
    const hasDoc = !!documentId || !!dqfDocument;
    const calculatedStatus = calculateStatus(expirationDate, !!documentId);
    const payload: any = {
      documentType,
      customName: customName || '',
      issueDate: issueDate || null,
      expirationDate: expirationDate || null,
      status: calculatedStatus,
    };
    if (documentId) payload.documentId = documentId;
    try {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
            customName: customName || '',
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
            <Button size="sm" onClick={() => selectedFile && handleFileUpload(selectedFile)} disabled={isUploading || !selectedFile}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : hasDocument ? 'Replace File' : 'Upload File'}
            </Button>
            <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateDates(); }} disabled={isUploading} type="button">
              Save Dates
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowUploadForm(false); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={isUploading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
