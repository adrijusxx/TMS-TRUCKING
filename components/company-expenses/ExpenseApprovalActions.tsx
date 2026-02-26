'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type { FeedSource } from '@/app/api/company-expenses/feed/route';

interface ExpenseApprovalActionsProps {
  id: string;
  source: FeedSource;
  approvalStatus: string | null;
  canApprove: boolean;
}

export function ExpenseApprovalActions({
  id,
  source,
  approvalStatus,
  canApprove,
}: ExpenseApprovalActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const qc = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ approved, rejectionReason }: { approved: boolean; rejectionReason?: string }) => {
      const res = await fetch(apiUrl(`/api/company-expenses/${id}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, rejectionReason: rejectionReason ?? null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed');
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['company-expenses-feed'] });
      qc.invalidateQueries({ queryKey: ['company-expenses-summary'] });
      toast.success(vars.approved ? 'Expense approved' : 'Expense rejected');
      setRejectOpen(false);
      setReason('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Only show for COMPANY_EXPENSE rows that are PENDING, for approvers
  if (source !== 'COMPANY_EXPENSE' || approvalStatus !== 'PENDING' || !canApprove) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          disabled={approveMutation.isPending}
          onClick={() => approveMutation.mutate({ approved: true })}
          title="Approve"
        >
          {approveMutation.isPending && approveMutation.variables?.approved
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Check className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={approveMutation.isPending}
          onClick={() => setRejectOpen(true)}
          title="Reject"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Rejection reason dialog */}
      <Dialog open={rejectOpen} onOpenChange={(v) => { setRejectOpen(v); if (!v) setReason(''); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this being rejected?"
              rows={3}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate({ approved: false, rejectionReason: reason || undefined })}
            >
              {approveMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
