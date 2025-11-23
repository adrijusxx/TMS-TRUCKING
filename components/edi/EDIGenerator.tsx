'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';

async function generateEDI(data: {
  type: '204' | '210' | '214';
  loadId?: string;
  invoiceId?: string;
}) {
  const response = await fetch(apiUrl('/api/edi/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate EDI');
  }
  return response.json();
}

export default function EDIGenerator() {
  const [ediType, setEdiType] = useState<'204' | '210' | '214'>('204');
  const [loadId, setLoadId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');

  const generateMutation = useMutation({
    mutationFn: generateEDI,
    onSuccess: (data) => {
      toast.success('EDI file generated successfully');
      setGeneratedContent(data.data.content);
      setFilename(data.data.filename);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate EDI');
    },
  });

  const [generatedContent, setGeneratedContent] = useState('');
  const [filename, setFilename] = useState('');

  const handleGenerate = () => {
    if (ediType === '204' || ediType === '214') {
      if (!loadId) {
        toast.error('Load ID is required');
        return;
      }
      generateMutation.mutate({ type: ediType, loadId });
    } else if (ediType === '210') {
      if (!invoiceId) {
        toast.error('Invoice ID is required');
        return;
      }
      generateMutation.mutate({ type: ediType, invoiceId });
    }
  };

  const handleDownload = () => {
    if (!generatedContent) return;

    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'edi_file.edi';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/edi/testing">
          <Button variant="outline">
            Testing Environment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate EDI File</CardTitle>
          <CardDescription>
            Create EDI 204 (Load Tender), 210 (Invoice), or 214 (Status Update)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ediType">EDI Type</Label>
            <Select value={ediType} onValueChange={(v) => setEdiType(v as '204' | '210' | '214')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="204">204 - Load Tender</SelectItem>
                <SelectItem value="210">210 - Invoice</SelectItem>
                <SelectItem value="214">214 - Shipment Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(ediType === '204' || ediType === '214') && (
            <div className="space-y-2">
              <Label htmlFor="loadId">Load ID</Label>
              <Input
                id="loadId"
                placeholder="Enter load ID"
                value={loadId}
                onChange={(e) => setLoadId(e.target.value)}
              />
            </div>
          )}

          {ediType === '210' && (
            <div className="space-y-2">
              <Label htmlFor="invoiceId">Invoice ID</Label>
              <Input
                id="invoiceId"
                placeholder="Enter invoice ID"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
              />
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? 'Generating...' : 'Generate EDI File'}
          </Button>

          {generatedContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Generated EDI Content</Label>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <Textarea
                value={generatedContent}
                readOnly
                rows={20}
                className="font-mono text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

