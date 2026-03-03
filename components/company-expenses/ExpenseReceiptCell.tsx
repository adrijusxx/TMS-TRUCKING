'use client';

import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Upload, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type { FeedSource } from '@/app/api/company-expenses/feed/route';

interface ExpenseReceiptCellProps {
  id: string;
  source: FeedSource;
  receiptUrl: string | null;
}

export function ExpenseReceiptCell({ id, source, receiptUrl }: ExpenseReceiptCellProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: upload the file to /api/documents/upload
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'RECEIPT');
      fd.append('title', file.name);
      const uploadRes = await fetch(apiUrl('/api/documents/upload'), { method: 'POST', body: fd });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error?.message || 'Upload failed');
      }
      const { data: doc } = await uploadRes.json();

      // Step 2: patch the company expense with the receipt URL
      const patchRes = await fetch(apiUrl(`/api/company-expenses/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: doc.fileUrl, hasReceipt: true }),
      });
      if (!patchRes.ok) throw new Error('Failed to save receipt link');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-expenses'] });
      qc.invalidateQueries({ queryKey: ['company-expenses-summary'] });
      toast.success('Receipt uploaded');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (receiptUrl) {
    return (
      <a
        href={receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Paperclip className="h-3 w-3" />
        <span>View</span>
        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
      </a>
    );
  }

  if (source !== 'COMPANY_EXPENSE') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadMutation.mutate(file);
          e.target.value = '';
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
        disabled={uploadMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadMutation.isPending
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Upload className="h-3 w-3" />}
        {!uploadMutation.isPending && 'Upload'}
      </Button>
    </>
  );
}
