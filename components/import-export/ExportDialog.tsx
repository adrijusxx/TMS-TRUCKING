'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface ExportDialogProps {
  entityType: string;
  exportUrl?: string;
  filename?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ExportDialog({
  entityType,
  exportUrl,
  filename,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ExportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [`export-${entityType}`, format],
    queryFn: async () => {
      const url = exportUrl || `/api/import-export/${entityType}?format=${format}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'csv') {
        const csv = await response.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || `${entityType}-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        return { success: true };
      }

      const json = await response.json();
      const blob = new Blob([JSON.stringify(json.data.rows || json.data, null, 2)], { type: 'application/json' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `${entityType}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      return { success: true };
    },
    enabled: false, // Only run when manually triggered
  });

  const handleExport = async () => {
    try {
      await refetch();
      toast.success(`Export completed successfully`);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Export failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</DialogTitle>
          <DialogDescription>
            Export {entityType} data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">Format</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'json') => setFormat(value)}>
              <SelectTrigger id="export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-headers"
              checked={includeHeaders}
              onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
            />
            <Label htmlFor="include-headers" className="text-sm font-normal cursor-pointer">
              Include column headers
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <FileText className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

