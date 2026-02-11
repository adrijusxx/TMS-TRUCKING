'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Upload } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface DQFDocumentUploadProps {
  driverId: string;
}

const DOCUMENT_TYPES = [
  { value: 'APPLICATION', label: 'Application for Employment' },
  { value: 'ROAD_TEST', label: 'Road Test Certificate' },
  { value: 'PREVIOUS_EMPLOYMENT_VERIFICATION', label: 'Previous Employment Verification' },
  { value: 'ANNUAL_REVIEW', label: 'Annual Review' },
  { value: 'MEDICAL_EXAMINERS_CERTIFICATE', label: "Medical Examiner's Certificate" },
  { value: 'CDL_COPY', label: 'CDL Copy' },
  { value: 'MVR_RECORD', label: 'MVR Record' },
  { value: 'DRUG_TEST_RESULT', label: 'Drug Test Result' },
  { value: 'ALCOHOL_TEST_RESULT', label: 'Alcohol Test Result' },
  { value: 'TRAINING_CERTIFICATE', label: 'Training Certificate' },
  { value: 'OTHER', label: 'Other' }
];

export default function DQFDocumentUpload({ driverId }: DQFDocumentUploadProps) {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`), {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dqf', driverId] });
      toast.success('Document uploaded to DQF successfully');
      setFile(null);
      setDocumentType('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload document');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast.warning('Please select a file and document type');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      // First upload the document
      const uploadResponse = await fetch(apiUrl('/api/safety/documents'), {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      const { document } = await uploadResponse.json();

      // Then link it to DQF
      const linkFormData = new FormData();
      linkFormData.append('documentId', document.id);
      linkFormData.append('documentType', documentType);
      await uploadMutation.mutateAsync(linkFormData);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Add a document to the Driver Qualification File
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>File</Label>
          <Input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || !documentType || uploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </CardContent>
    </Card>
  );
}

