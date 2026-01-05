'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface DocumentUploadProps {
  loadId?: string;
  driverId?: string;
  truckId?: string;
  onSuccess?: (data?: any) => void;
  onFileSelected?: (file: File) => void; // For collecting files before load creation
  defaultType?: string; // Pre-select document type
}

// Document types for load-related uploads (POD, BOL, Rate Con, Detention, Lumper, Other)
const loadDocumentTypes = [
  { value: 'RATE_CONFIRMATION', label: 'Rate Confirmation' },
  { value: 'BOL', label: 'Bill of Lading' },
  { value: 'POD', label: 'Proof of Delivery' },
  { value: 'DETENTION', label: 'Detention' },
  { value: 'LUMPER', label: 'Lumper' },
  { value: 'OTHER', label: 'Other' },
];

// All document types for driver/truck uploads
const allDocumentTypes = [
  { value: 'RATE_CONFIRMATION', label: 'Rate Confirmation' },
  { value: 'BOL', label: 'Bill of Lading' },
  { value: 'POD', label: 'Proof of Delivery' },
  { value: 'DETENTION', label: 'Detention' },
  { value: 'LUMPER', label: 'Lumper' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'DRIVER_LICENSE', label: 'Driver License' },
  { value: 'MEDICAL_CARD', label: 'Medical Card' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'COI', label: 'Certificate of Insurance' },
  { value: 'REGISTRATION', label: 'Registration' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'LEASE_AGREEMENT', label: 'Lease Agreement' },
  { value: 'W9', label: 'W9 Form' },
  { value: 'OTHER', label: 'Other' },
];

async function uploadDocument(formData: FormData) {
  const response = await fetch(apiUrl('/api/documents/upload'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload document');
  }
  return response.json();
}

export default function DocumentUpload({
  loadId,
  driverId,
  truckId,
  onSuccess,
  onFileSelected,
  defaultType,
}: DocumentUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>(defaultType || '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Update documentType when defaultType changes
  useEffect(() => {
    if (defaultType) {
      setDocumentType(defaultType);
    }
  }, [defaultType]);

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (loadId) {
        queryClient.invalidateQueries({ queryKey: ['loads', loadId] });
      }
      if (driverId) {
        queryClient.invalidateQueries({ queryKey: ['drivers', driverId] });
      }
      if (truckId) {
        queryClient.invalidateQueries({ queryKey: ['trucks', truckId] });
      }
      setSelectedFile(null);
      setDocumentType('');
      setDescription('');
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.(data);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setError('Please select a file and document type');
      return;
    }

    // If no loadId/driverId/truckId and onFileSelected callback provided, just pass file to callback
    // This is for collecting files before entity creation (e.g., before load is created)
    if (!loadId && !driverId && !truckId && onFileSelected) {
      onFileSelected(selectedFile);
      setSelectedFile(null);
      setDocumentType('');
      setDescription('');
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Otherwise, upload immediately
    const fileUrl = `/uploads/${Date.now()}-${selectedFile.name}`;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', documentType);
    formData.append('fileName', selectedFile.name);
    formData.append('title', description || selectedFile.name); // Use description as title if provided, otherwise use filename
    formData.append('fileUrl', fileUrl);
    formData.append('fileSize', selectedFile.size.toString());
    formData.append('mimeType', selectedFile.type);
    if (description) formData.append('description', description);
    if (loadId) formData.append('loadId', loadId);
    if (driverId) formData.append('driverId', driverId);
    if (truckId) formData.append('truckId', truckId);

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload BOL, POD, invoices, or other documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="file">File</Label>
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span>{selectedFile.name}</span>
                <span className="text-muted-foreground">
                  ({formatFileSize(selectedFile.size)})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentType">Document Type *</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {(loadId ? loadDocumentTypes : allDocumentTypes).map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || uploadMutation.isPending}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
        </Button>
      </CardContent>
    </Card>
  );
}

