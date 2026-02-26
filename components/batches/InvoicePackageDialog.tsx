'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Download, ExternalLink, RotateCcw } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface InvoicePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
}

interface DocOptions {
  rateCon: boolean;
  pod: boolean;
  bol: boolean;
}

const DEFAULT_OPTIONS: DocOptions = { rateCon: true, pod: true, bol: true };

function buildPackageUrl(invoiceId: string, opts: DocOptions): string {
  const params = new URLSearchParams({
    rateCon: String(opts.rateCon),
    pod: String(opts.pod),
    bol: String(opts.bol),
  });
  return apiUrl(`/api/invoices/${invoiceId}/package?${params}`);
}

export function InvoicePackageDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
}: InvoicePackageDialogProps) {
  const [options, setOptions] = useState<DocOptions>(DEFAULT_OPTIONS);
  // The URL the iframe currently displays — updated only when user clicks "Regenerate PDF"
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Build preview URL when dialog opens (reset to defaults)
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setOptions(DEFAULT_OPTIONS);
        setPreviewUrl(buildPackageUrl(invoiceId, DEFAULT_OPTIONS));
      }
      onOpenChange(isOpen);
    },
    [invoiceId, onOpenChange]
  );

  const handleRegenerate = () => {
    setPreviewUrl(buildPackageUrl(invoiceId, options));
  };

  const handleReset = () => {
    setOptions(DEFAULT_OPTIONS);
    setPreviewUrl(buildPackageUrl(invoiceId, DEFAULT_OPTIONS));
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const url = buildPackageUrl(invoiceId, options);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to generate package');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `invoice-package-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const toggle = (key: keyof DocOptions) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              Invoice Preview — {invoiceNumber}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Document Options Bar */}
        <div className="flex items-center gap-6 px-5 py-3 border-b bg-muted/30 flex-shrink-0">
          <span className="text-sm font-medium text-muted-foreground">Document Options</span>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="opt-ratecon"
                checked={options.rateCon}
                onCheckedChange={() => toggle('rateCon')}
              />
              <Label htmlFor="opt-ratecon" className="text-sm cursor-pointer">Rate Confirmation</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="opt-pod"
                checked={options.pod}
                onCheckedChange={() => toggle('pod')}
              />
              <Label htmlFor="opt-pod" className="text-sm cursor-pointer">Proof of Delivery</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="opt-bol"
                checked={options.bol}
                onCheckedChange={() => toggle('bol')}
              />
              <Label htmlFor="opt-bol" className="text-sm cursor-pointer">Bill of Lading</Label>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset to Default
            </Button>
            <Button variant="outline" size="sm" onClick={handleRegenerate}>
              Regenerate PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(buildPackageUrl(invoiceId, options), '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5" />
              )}
              Download
            </Button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="flex-1 bg-muted/20 overflow-hidden">
          {previewUrl ? (
            <iframe
              key={previewUrl}
              src={previewUrl}
              className="w-full h-full border-0"
              title={`Invoice ${invoiceNumber} Package`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Click "Regenerate PDF" to preview
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
