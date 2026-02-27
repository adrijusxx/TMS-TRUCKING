'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Download, ExternalLink, RotateCcw, RefreshCw } from 'lucide-react';
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
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-regenerate preview when options change (debounced)
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      setPreviewUrl(buildPackageUrl(invoiceId, options));
    }, 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [options, invoiceId, open]);

  // Reset options when dialog opens; useEffect handles preview URL
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setOptions(DEFAULT_OPTIONS);
      } else {
        setPreviewUrl('');
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const handleRefresh = () => {
    setIsLoading(true);
    setPreviewUrl(buildPackageUrl(invoiceId, options) + `&_t=${Date.now()}`);
  };

  const handleReset = () => {
    setOptions(DEFAULT_OPTIONS);
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
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              Invoice Preview — {invoiceNumber}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Document Options & Actions Bar */}
        <div className="px-5 py-3 border-b bg-muted/30 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Include:</span>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="opt-ratecon"
                  checked={options.rateCon}
                  onCheckedChange={() => toggle('rateCon')}
                />
                <Label htmlFor="opt-ratecon" className="text-sm cursor-pointer whitespace-nowrap">Rate Con</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="opt-pod"
                  checked={options.pod}
                  onCheckedChange={() => toggle('pod')}
                />
                <Label htmlFor="opt-pod" className="text-sm cursor-pointer">POD</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="opt-bol"
                  checked={options.bol}
                  onCheckedChange={() => toggle('bol')}
                />
                <Label htmlFor="opt-bol" className="text-sm cursor-pointer">BOL</Label>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Refresh
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
        </div>

        {/* PDF Preview */}
        <div className="flex-1 bg-muted/20 overflow-hidden relative">
          {previewUrl ? (
            <>
              <iframe
                key={previewUrl}
                src={previewUrl}
                className="w-full h-full border-0"
                title={`Invoice ${invoiceNumber} Package`}
                onLoad={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm">Generating PDF…</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading preview…
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
