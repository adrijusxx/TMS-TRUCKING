'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { apiUrl, formatDate } from '@/lib/utils';
import { DriverComplianceData } from '@/types/compliance';
import { getStatusBadgeColor, formatDaysUntilExpiration, isExpired, isExpiringSoon, daysUntilExpiration } from '@/lib/utils/compliance-status';
import { toast } from 'sonner';
import { FileCheck, Heart, CreditCard, Search, TestTube, Clock, Calendar, FileText, Upload, Download, X, Trash2 } from 'lucide-react';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentListNew';

interface DriverComplianceEditorProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
}

const REQUIRED_DOCUMENTS = [
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

export default function DriverComplianceEditor({
  driver,
  onSave,
  onCancel,
}: DriverComplianceEditorProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dqf');

  // DQF Update Mutation
  const dqfMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/dqf`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update DQF');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('DQF updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dqf', driver.driverId] });
      await onSave();
    },
    onError: () => {
      toast.error('Failed to update DQF');
    },
  });

  // Medical Card Mutations
  const createMedicalCardMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        apiUrl(`/api/safety/driver-compliance/${driver.driverId}/medical-card`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to create medical card');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Medical card created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['medical-card', driver.driverId] });
      await onSave();
    },
    onError: () => {
      toast.error('Failed to create medical card');
    },
  });

  const updateMedicalCardMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        apiUrl(`/api/safety/driver-compliance/${driver.driverId}/medical-card`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to update medical card');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Medical card updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['medical-card', driver.driverId] });
      await onSave();
    },
    onError: () => {
      toast.error('Failed to update medical card');
    },
  });

  // CDL Mutations
  const createCDLMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/cdl`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create CDL record');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('CDL record created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['cdl', driver.driverId] });
      await onSave();
    },
    onError: () => {
      toast.error('Failed to create CDL record');
    },
  });

  const updateCDLMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/cdl`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update CDL record');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('CDL record updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['cdl', driver.driverId] });
      await onSave();
    },
    onError: () => {
      toast.error('Failed to update CDL record');
    },
  });

  // MVR Mutation
  const createMVRMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/mvr`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create MVR record');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('MVR record created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['mvr', driver.driverId] });
      await onSave();
    },
    onError: () => {
      toast.error('Failed to create MVR record');
    },
  });

  // Drug Test Mutation
  const createDrugTestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        apiUrl(`/api/safety/driver-compliance/${driver.driverId}/drug-test`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to create drug test');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Drug test created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['drug-tests', driver.driverId] });
      await onSave();
    },
    onError: () => {
      toast.error('Failed to create drug test');
    },
  });

  // Annual Review Mutation
  const createAnnualReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        apiUrl(`/api/safety/driver-compliance/${driver.driverId}/annual-review`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to create annual review');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Annual review created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['annual-review', driver.driverId] });
      await onSave();
    },
    onError: () => {
      toast.error('Failed to create annual review');
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Edit Compliance: {driver.driverName}</h3>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Close
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dqf">
            <FileCheck className="h-4 w-4 mr-2" />
            DQF
          </TabsTrigger>
          <TabsTrigger value="medical">
            <Heart className="h-4 w-4 mr-2" />
            Medical
          </TabsTrigger>
          <TabsTrigger value="cdl">
            <CreditCard className="h-4 w-4 mr-2" />
            CDL
          </TabsTrigger>
          <TabsTrigger value="mvr">
            <Search className="h-4 w-4 mr-2" />
            MVR
          </TabsTrigger>
          <TabsTrigger value="drug-tests">
            <TestTube className="h-4 w-4 mr-2" />
            Drug Tests
          </TabsTrigger>
          <TabsTrigger value="hos">
            <Clock className="h-4 w-4 mr-2" />
            HOS
          </TabsTrigger>
          <TabsTrigger value="annual-review">
            <Calendar className="h-4 w-4 mr-2" />
            Annual Review
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* DQF Tab */}
        <TabsContent value="dqf" className="mt-4">
          <DQFEditor driver={driver} onSave={async () => { await onSave(); }} />
        </TabsContent>

        {/* Medical Card Tab */}
        <TabsContent value="medical" className="mt-4">
          <MedicalCardEditor
            driver={driver}
            onCreate={createMedicalCardMutation.mutate}
            onUpdate={updateMedicalCardMutation.mutate}
          />
        </TabsContent>

        {/* CDL Tab */}
        <TabsContent value="cdl" className="mt-4">
          <CDLEditor
            driver={driver}
            onCreate={createCDLMutation.mutate}
            onUpdate={updateCDLMutation.mutate}
          />
        </TabsContent>

        {/* MVR Tab */}
        <TabsContent value="mvr" className="mt-4">
          <MVREditor driver={driver} onCreate={createMVRMutation.mutate} />
        </TabsContent>

        {/* Drug Tests Tab */}
        <TabsContent value="drug-tests" className="mt-4">
          <DrugTestEditor driver={driver} onCreate={createDrugTestMutation.mutate} />
        </TabsContent>

        {/* HOS Tab */}
        <TabsContent value="hos" className="mt-4">
          <HOSEditor driver={driver} />
        </TabsContent>

        {/* Annual Review Tab */}
        <TabsContent value="annual-review" className="mt-4">
          <AnnualReviewEditor driver={driver} onCreate={createAnnualReviewMutation.mutate} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <DriverDocumentsTab driverId={driver.driverId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// DQF Editor Component
function DQFEditor({ driver, onSave }: { driver: DriverComplianceData; onSave: () => void | Promise<void> }) {
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

// DQF Document Item Component with Upload
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
  // Calculate status from expiration date
  const calculateStatus = (expDate: string | null, hasDoc: boolean): 'COMPLETE' | 'MISSING' | 'EXPIRING' | 'EXPIRED' => {
    if (!hasDoc) return 'MISSING';
    if (!expDate || expDate.trim() === '') return 'COMPLETE';
    
    try {
      const expirationDate = new Date(expDate);
      if (isNaN(expirationDate.getTime())) return 'COMPLETE';
      
      if (isExpired(expirationDate)) return 'EXPIRED';
      if (isExpiringSoon(expirationDate)) return 'EXPIRING';
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

  // Update state when dqfDocument changes
  useEffect(() => {
    if (dqfDocument) {
      const expDate = dqfDocument.expirationDate ? new Date(dqfDocument.expirationDate).toISOString().split('T')[0] : '';
      setIssueDate(
        dqfDocument.issueDate ? new Date(dqfDocument.issueDate).toISOString().split('T')[0] : ''
      );
      setExpirationDate(expDate);
      setStatus(calculateStatus(expDate, !!dqfDocument.document));
    } else {
      setIssueDate('');
      setExpirationDate('');
      setStatus('MISSING');
    }
    setSelectedFile(null);
  }, [dqfDocument]);

  // Auto-calculate status when expiration date changes
  useEffect(() => {
    if (expirationDate || dqfDocument?.document) {
      const newStatus = calculateStatus(expirationDate, !!dqfDocument?.document || !!selectedFile);
      setStatus(newStatus);
    }
  }, [expirationDate, dqfDocument?.document, selectedFile]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Step 1: Upload the document file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'OTHER'); // Generic type, will be linked to DQF
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

      // Step 2: Link document to DQF with dates and status
      const dqfResponse = await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          documentType: documentType,
          issueDate: issueDate || null,
          expirationDate: expirationDate || null,
          status: status,
        }),
      });

      if (!dqfResponse.ok) {
        throw new Error('Failed to link document to DQF');
      }

      toast.success(`${label} uploaded successfully`);
      setShowUploadForm(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Invalidate all related queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dqf', driverId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      await onUpdate();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateDates = async () => {
    // Get documentId - it should be in dqfDocument.documentId (from API) or fallback to dqfDocument.document?.id
    const documentId = dqfDocument?.documentId || dqfDocument?.document?.id;
    
    console.log('handleUpdateDates called', { 
      dqfDocument, 
      documentId,
      documentIdFromDoc: dqfDocument?.document?.id,
      documentIdFromDqf: dqfDocument?.documentId,
      dqfDocumentId: dqfDocument?.id,
      driverId,
      documentType,
      issueDate,
      expirationDate,
      status 
    });

    if (!documentId) {
      console.error('No document ID found', dqfDocument);
      toast.error('Please upload a document first');
      return;
    }

    // Recalculate status based on expiration date
    const calculatedStatus = calculateStatus(expirationDate, !!dqfDocument?.document || true);
    console.log('Calculated status:', calculatedStatus, 'from expiration date:', expirationDate);

    try {
      const payload = {
        documentId: documentId,
        documentType: documentType,
        issueDate: issueDate || null,
        expirationDate: expirationDate || null,
        status: calculatedStatus, // Use calculated status instead of state
      };

      console.log('Sending update request:', payload);
      console.log('API URL:', apiUrl(`/api/safety/drivers/${driverId}/dqf`));

      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error?.message || errorData.error || 'Failed to update dates');
      }

      const responseData = await response.json();
      console.log('Update successful:', responseData);

      // Update local status state
      setStatus(calculatedStatus);

      toast.success('Dates updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dqf', driverId] });
      await onUpdate();
    } catch (error: any) {
      console.error('Error updating dates:', error);
      console.error('Error stack:', error.stack);
      toast.error(error.message || 'Failed to update dates');
    }
  };

  const handleDeleteDocument = async () => {
    // Get documentId - it should be in dqfDocument.documentId (from API) or fallback to dqfDocument.document?.id
    const documentId = dqfDocument?.documentId || dqfDocument?.document?.id;
    
    if (!documentId) {
      toast.error('No document to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${dqfDocument.document?.fileName || 'this document'}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete the document (soft delete)
      const deleteResponse = await fetch(apiUrl(`/api/documents/${documentId}`), {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        throw new Error(error.error?.message || 'Failed to delete document');
      }

      // Update DQF document status to MISSING since document is deleted
      // Note: We keep the documentId reference but mark status as MISSING
      // since the document is soft deleted and will be filtered out in queries
      try {
        await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: documentId, // Keep reference (document is soft deleted)
            documentType: documentType,
            status: 'MISSING',
            issueDate: issueDate || null,
            expirationDate: expirationDate || null,
          }),
        });
      } catch (dqfError) {
        console.error('Failed to update DQF document status:', dqfError);
        // Continue even if DQF update fails - the document deletion is the main action
      }

      toast.success('Document deleted successfully');
      
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dqf', driverId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      await onUpdate();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate current status (use calculated status, fallback to document status)
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
              <div className="text-sm text-muted-foreground">
                Expires: {formatDate(dqfDocument.expirationDate)}
              </div>
            )}
            {dqfDocument?.issueDate && (
              <div className="text-sm text-muted-foreground">
                Issued: {formatDate(dqfDocument.issueDate)}
              </div>
            )}
            {hasDocument && dqfDocument.document && (
              <div className="text-sm text-primary mt-1 flex items-center gap-2">
                <a
                  href={dqfDocument.document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  <Download className="h-3 w-3" />
                  {dqfDocument.document.fileName}
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteDocument}
                  disabled={isDeleting}
                  title="Delete document"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={hasDocument ? 'outline' : 'default'}
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          <Upload className="h-4 w-4 mr-2" />
          {hasDocument ? 'Update' : 'Upload'}
        </Button>
      </div>

      {showUploadForm && (
        <div className="border-t pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Status (Auto-calculated)</Label>
            <div className="flex items-center gap-2">
              <Badge className={getStatusBadgeColor(status)}>{status}</Badge>
              {expirationDate && (
                <span className="text-sm text-muted-foreground">
                  {formatDaysUntilExpiration(
                    daysUntilExpiration(new Date(expirationDate))
                  )}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Status is automatically calculated based on expiration date
            </p>
          </div>
          <div>
            <Label>File</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={isUploading}
                className="flex-1"
              />
              {selectedFile && (
                <span className="text-sm text-muted-foreground self-center">
                  {selectedFile.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {selectedFile && (
              <Button
                size="sm"
                onClick={() => handleFileUpload(selectedFile)}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : hasDocument ? 'Replace File' : 'Upload File'}
              </Button>
            )}
            {hasDocument && (
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Update Dates button clicked');
                  handleUpdateDates();
                }} 
                disabled={isUploading || !!selectedFile}
                type="button"
              >
                Update Dates & Status
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Medical Card Editor Component
function MedicalCardEditor({
  driver,
  onCreate,
  onUpdate,
}: {
  driver: DriverComplianceData;
  onCreate: (data: any) => void;
  onUpdate: (data: any) => void;
}) {
  const { register, handleSubmit } = useForm({
    defaultValues: driver.medicalCard
      ? {
          cardNumber: driver.medicalCard.cardNumber,
          expirationDate: new Date(driver.medicalCard.expirationDate).toISOString().split('T')[0],
          issueDate: driver.medicalCard.issueDate
            ? new Date(driver.medicalCard.issueDate).toISOString().split('T')[0]
            : '',
          medicalExaminerName: driver.medicalCard.medicalExaminerName || '',
          medicalExaminerCertificateNumber: driver.medicalCard.medicalExaminerCertificateNumber || '',
          waiverInformation: driver.medicalCard.waiverInformation || '',
        }
      : {},
  });

  const onSubmit = (data: any) => {
    if (driver.medicalCard) {
      onUpdate({ id: driver.medicalCard.id, ...data });
    } else {
      onCreate(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Card</CardTitle>
        <CardDescription>Manage driver medical card information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Card Number</Label>
              <Input {...register('cardNumber', { required: true })} />
            </div>
            <div>
              <Label>Expiration Date</Label>
              <Input type="date" {...register('expirationDate', { required: true })} />
            </div>
            <div>
              <Label>Issue Date</Label>
              <Input type="date" {...register('issueDate')} />
            </div>
            <div>
              <Label>Medical Examiner Name</Label>
              <Input {...register('medicalExaminerName')} />
            </div>
            <div>
              <Label>Examiner Certificate Number</Label>
              <Input {...register('medicalExaminerCertificateNumber')} />
            </div>
            <div>
              <Label>Waiver Information</Label>
              <Textarea {...register('waiverInformation')} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{driver.medicalCard ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// CDL Editor Component
function CDLEditor({
  driver,
  onCreate,
  onUpdate,
}: {
  driver: DriverComplianceData;
  onCreate: (data: any) => void;
  onUpdate: (data: any) => void;
}) {
  const { register, handleSubmit } = useForm({
    defaultValues: driver.cdl
      ? {
          cdlNumber: driver.cdl.cdlNumber,
          expirationDate: new Date(driver.cdl.expirationDate).toISOString().split('T')[0],
          issueDate: driver.cdl.issueDate
            ? new Date(driver.cdl.issueDate).toISOString().split('T')[0]
            : '',
          issueState: driver.cdl.issueState,
          licenseClass: driver.cdl.licenseClass || '',
          endorsements: driver.cdl.endorsements.join(', '),
          restrictions: driver.cdl.restrictions.join(', '),
        }
      : {},
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      endorsements: data.endorsements ? data.endorsements.split(',').map((e: string) => e.trim()) : [],
      restrictions: data.restrictions ? data.restrictions.split(',').map((r: string) => r.trim()) : [],
    };
    if (driver.cdl) {
      onUpdate(payload);
    } else {
      onCreate(payload);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CDL Record</CardTitle>
        <CardDescription>Manage Commercial Driver's License information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CDL Number</Label>
              <Input {...register('cdlNumber', { required: true })} />
            </div>
            <div>
              <Label>Expiration Date</Label>
              <Input type="date" {...register('expirationDate', { required: true })} />
            </div>
            <div>
              <Label>Issue Date</Label>
              <Input type="date" {...register('issueDate')} />
            </div>
            <div>
              <Label>Issue State</Label>
              <Input {...register('issueState', { required: true })} />
            </div>
            <div>
              <Label>License Class (A, B, C)</Label>
              <Input {...register('licenseClass')} />
            </div>
            <div>
              <Label>Endorsements (comma-separated)</Label>
              <Input {...register('endorsements')} placeholder="H, N, T, X" />
            </div>
            <div>
              <Label>Restrictions (comma-separated)</Label>
              <Input {...register('restrictions')} placeholder="E, L, M, O, Z" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{driver.cdl ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// MVR Editor Component
function MVREditor({
  driver,
  onCreate,
}: {
  driver: DriverComplianceData;
  onCreate: (data: any) => void;
}) {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    onCreate({
      ...data,
      nextPullDueDate: data.nextPullDueDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MVR Records</CardTitle>
        <CardDescription>Add new Motor Vehicle Record</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {driver.mvr && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Last MVR Pull</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(driver.mvr.pullDate)} - {driver.mvr.state}
                  </div>
                  {driver.mvr.violations.length > 0 && (
                    <div className="text-sm text-destructive mt-1">
                      {driver.mvr.violations.length} violation(s)
                    </div>
                  )}
                </div>
                <Badge className={getStatusBadgeColor(driver.statusSummary.mvr.status)}>
                  {driver.statusSummary.mvr.status}
                </Badge>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pull Date</Label>
                <Input type="date" {...register('pullDate', { required: true })} />
              </div>
              <div>
                <Label>State</Label>
                <Input {...register('state', { required: true })} />
              </div>
              <div>
                <Label>Next Pull Due Date</Label>
                <Input type="date" {...register('nextPullDueDate')} />
              </div>
            </div>
            <Button type="submit">Add MVR Record</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

// Drug Test Editor Component
function DrugTestEditor({
  driver,
  onCreate,
}: {
  driver: DriverComplianceData;
  onCreate: (data: any) => void;
}) {
  const { register, handleSubmit, watch, setValue } = useForm();

  const onSubmit = (data: any) => {
    onCreate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drug & Alcohol Tests</CardTitle>
        <CardDescription>Add new drug/alcohol test record</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {driver.recentDrugTests.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">Recent Tests</div>
              {driver.recentDrugTests.map((test) => (
                <div key={test.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{test.testType}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(test.testDate)} - {test.testResult}
                      </div>
                    </div>
                    <Badge>{test.testResult}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test Date</Label>
                <Input type="date" {...register('testDate', { required: true })} />
              </div>
              <div>
                <Label>Test Type</Label>
                <Select
                  value={watch('testType') || ''}
                  onValueChange={(value) => setValue('testType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRE_EMPLOYMENT">Pre-Employment</SelectItem>
                    <SelectItem value="RANDOM">Random</SelectItem>
                    <SelectItem value="REASONABLE_SUSPICION">Reasonable Suspicion</SelectItem>
                    <SelectItem value="POST_ACCIDENT">Post-Accident</SelectItem>
                    <SelectItem value="RETURN_TO_DUTY">Return to Duty</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow-Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Test Result</Label>
                <Select
                  value={watch('testResult') || ''}
                  onValueChange={(value) => setValue('testResult', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEGATIVE">Negative</SelectItem>
                    <SelectItem value="POSITIVE">Positive</SelectItem>
                    <SelectItem value="REFUSED">Refused</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Testing Facility</Label>
                <Input {...register('testingFacility')} />
              </div>
            </div>
            <Button type="submit">Add Test</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

// HOS Editor Component (Read-only for now)
function HOSEditor({ driver }: { driver: DriverComplianceData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hours of Service</CardTitle>
        <CardDescription>HOS compliance and violations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Compliance Percentage</div>
              <div className="text-2xl font-bold">{driver.hos.compliancePercentage}%</div>
            </div>
            <Badge className={getStatusBadgeColor(driver.statusSummary.hos.status)}>
              {driver.statusSummary.hos.status}
            </Badge>
          </div>
          {driver.hos.violations.length > 0 && (
            <div>
              <div className="font-medium mb-2">Recent Violations</div>
              <div className="space-y-2">
                {driver.hos.violations.map((violation) => (
                  <div key={violation.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{violation.violationType}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(violation.violationDate)}
                          {violation.hoursExceeded && ` - ${violation.hoursExceeded} hours exceeded`}
                        </div>
                        {violation.violationDescription && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {violation.violationDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Driver Documents Tab Component
function DriverDocumentsTab({ driverId }: { driverId: string }) {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload files to this driver's profile (e.g., medical certificates, CDL copies, MVR records, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload driverId={driverId} onSuccess={handleUploadSuccess} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Driver Documents</CardTitle>
          <CardDescription>View and manage all documents for this driver</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList key={refreshKey} driverId={driverId} />
        </CardContent>
      </Card>
    </div>
  );
}

// Annual Review Editor Component
function AnnualReviewEditor({
  driver,
  onCreate,
}: {
  driver: DriverComplianceData;
  onCreate: (data: any) => void;
}) {
  const { register, handleSubmit, watch, setValue } = useForm();

  const onSubmit = (data: any) => {
    onCreate({
      ...data,
      completed: data.completed === 'true' || data.completed === true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual Reviews</CardTitle>
        <CardDescription>Manage annual review records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {driver.annualReviews.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">Recent Reviews</div>
              {driver.annualReviews.map((review) => (
                <div key={review.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{formatDate(review.reviewDate)}</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {formatDate(review.dueDate)} - {review.status}
                      </div>
                      {review.reviewNotes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {review.reviewNotes}
                        </div>
                      )}
                    </div>
                    <Badge>{review.status === 'COMPLETED' ? 'Completed' : 'Pending'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Review Date</Label>
                <Input type="date" {...register('reviewDate', { required: true })} />
              </div>
              <div>
                <Label>Next Review Date</Label>
                <Input type="date" {...register('nextReviewDate')} />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={watch('status') || ''}
                  onValueChange={(value) => setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Completed</Label>
                <Select
                  value={watch('completed') || ''}
                  onValueChange={(value) => setValue('completed', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reviewer Name</Label>
                <Input {...register('reviewerName')} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea {...register('notes')} />
              </div>
            </div>
            <Button type="submit">Add Review</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

