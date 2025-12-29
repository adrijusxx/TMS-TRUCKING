'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Loader2, Eye, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface AISuggestion {
  id: string;
  suggestionType: string;
  entityType: string;
  entityId: string | null;
  aiConfidence: number;
  aiReasoning: string;
  suggestedValue: any;
  originalValue: any | null;
  status: string;
  createdAt: string;
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  appliedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

async function fetchPendingSuggestions(filters?: {
  suggestionType?: string;
  entityType?: string;
  minConfidence?: number;
}): Promise<AISuggestion[]> {
  const params = new URLSearchParams();
  if (filters?.suggestionType) params.append('suggestionType', filters.suggestionType);
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.minConfidence) params.append('minConfidence', filters.minConfidence.toString());

  const response = await fetch(`/api/ai/verification?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending suggestions');
  }
  const data = await response.json();
  return data.data;
}

async function approveSuggestion(suggestionId: string, approved: boolean, rejectionReason?: string) {
  const response = await fetch(`/api/ai/verification/${suggestionId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved, rejectionReason }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to approve/reject suggestion');
  }
  return response.json();
}

async function applySuggestion(suggestionId: string) {
  const response = await fetch(`/api/ai/verification/${suggestionId}/apply`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to apply suggestion');
  }
  return response.json();
}

export default function AIVerificationQueue() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    suggestionType?: string;
    entityType?: string;
    minConfidence?: number;
  }>({});
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null);
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; approved: boolean }>({
    open: false,
    approved: false,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: suggestions, isLoading, refetch } = useQuery({
    queryKey: ['ai-verification-queue', filters],
    queryFn: () => fetchPendingSuggestions(filters),
  });

  const approveMutation = useMutation({
    mutationFn: ({ suggestionId, approved, reason }: { suggestionId: string; approved: boolean; reason?: string }) =>
      approveSuggestion(suggestionId, approved, reason),
    onSuccess: () => {
      toast.success(approvalDialog.approved ? 'Suggestion approved' : 'Suggestion rejected');
      queryClient.invalidateQueries({ queryKey: ['ai-verification-queue'] });
      setApprovalDialog({ open: false, approved: false });
      setSelectedSuggestion(null);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const applyMutation = useMutation({
    mutationFn: applySuggestion,
    onSuccess: () => {
      toast.success('Suggestion applied successfully');
      queryClient.invalidateQueries({ queryKey: ['ai-verification-queue'] });
      setSelectedSuggestion(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (suggestion: AISuggestion) => {
    setSelectedSuggestion(suggestion);
    setApprovalDialog({ open: true, approved: true });
    setRejectionReason('');
  };

  const handleReject = (suggestion: AISuggestion) => {
    setSelectedSuggestion(suggestion);
    setApprovalDialog({ open: true, approved: false });
    setRejectionReason('');
  };

  const confirmApproval = () => {
    if (!selectedSuggestion) return;
    approveMutation.mutate({
      suggestionId: selectedSuggestion.id,
      approved: approvalDialog.approved,
      reason: approvalDialog.approved ? undefined : rejectionReason,
    });
  };

  const getEntityLink = (suggestion: AISuggestion) => {
    if (!suggestion.entityId) return null;
    const basePath = `/dashboard/${suggestion.entityType.toLowerCase()}s`;
    return `${basePath}/${suggestion.entityId}`;
  };

  const formatSuggestionValue = (value: any, type: string) => {
    if (type === 'RATE_RECOMMENDATION') {
      return `$${value.revenue?.toFixed(2) || 'N/A'}`;
    }
    if (type === 'EXPENSE_CATEGORIZATION') {
      return value.categoryName || 'N/A';
    }
    if (type === 'INVOICE_MATCHING') {
      return `Match: $${value.amount?.toFixed(2) || 'N/A'}`;
    }
    return JSON.stringify(value, null, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            AI Verification Queue
          </CardTitle>
          <CardDescription>
            Review and approve AI suggestions that affect financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select
              value={filters.suggestionType || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, suggestionType: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RATE_RECOMMENDATION">Rate Recommendations</SelectItem>
                <SelectItem value="EXPENSE_CATEGORIZATION">Expense Categorization</SelectItem>
                <SelectItem value="INVOICE_MATCHING">Invoice Matching</SelectItem>
                <SelectItem value="SETTLEMENT_CALCULATION">Settlement Calculation</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.entityType || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, entityType: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="LOAD">Loads</SelectItem>
                <SelectItem value="INVOICE">Invoices</SelectItem>
                <SelectItem value="EXPENSE">Expenses</SelectItem>
                <SelectItem value="SETTLEMENT">Settlements</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()}>
              <Loader2 className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Suggested Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((suggestion) => (
                  <TableRow key={suggestion.id}>
                    <TableCell>
                      <Badge variant="outline">{suggestion.suggestionType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="secondary">{suggestion.entityType}</Badge>
                        {suggestion.entityId && getEntityLink(suggestion) && (
                          <Link
                            href={getEntityLink(suggestion)!}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Entity
                          </Link>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className={`h-4 w-4 ${
                            suggestion.aiConfidence >= 80
                              ? 'text-green-600'
                              : suggestion.aiConfidence >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        />
                        <span>{suggestion.aiConfidence.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {formatSuggestionValue(suggestion.suggestedValue, suggestion.suggestionType)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSuggestion(suggestion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(suggestion)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(suggestion)}
                          disabled={approveMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending AI suggestions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.approved ? 'Approve' : 'Reject'} AI Suggestion
            </DialogTitle>
            <DialogDescription>
              {selectedSuggestion && (
                <>
                  <div className="mt-4 space-y-2">
                    <div>
                      <strong>Type:</strong> {selectedSuggestion.suggestionType}
                    </div>
                    <div>
                      <strong>Entity:</strong> {selectedSuggestion.entityType}
                    </div>
                    <div>
                      <strong>Confidence:</strong> {selectedSuggestion.aiConfidence.toFixed(1)}%
                    </div>
                    <div>
                      <strong>AI Reasoning:</strong>
                      <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedSuggestion.aiReasoning}</p>
                    </div>
                    <div>
                      <strong>Original Value:</strong>
                      <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(selectedSuggestion.originalValue || {}, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <strong>Suggested Value:</strong>
                      <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(selectedSuggestion.suggestedValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {!approvalDialog.approved && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason (required)</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this suggestion is being rejected..."
                required
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalDialog({ open: false, approved: false });
                setSelectedSuggestion(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={approvalDialog.approved ? 'default' : 'destructive'}
              onClick={confirmApproval}
              disabled={
                approveMutation.isPending ||
                (!approvalDialog.approved && !rejectionReason.trim())
              }
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                approvalDialog.approved ? 'Approve' : 'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={!!selectedSuggestion && !approvalDialog.open} onOpenChange={(open) => !open && setSelectedSuggestion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Suggestion Details</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p>{selectedSuggestion.suggestionType}</p>
                </div>
                <div>
                  <Label>Entity</Label>
                  <p>{selectedSuggestion.entityType}</p>
                </div>
                <div>
                  <Label>Confidence</Label>
                  <p>{selectedSuggestion.aiConfidence.toFixed(1)}%</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge>{selectedSuggestion.status}</Badge>
                </div>
              </div>
              <div>
                <Label>AI Reasoning</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedSuggestion.aiReasoning}</p>
              </div>
              <div>
                <Label>Original Value</Label>
                <pre className="text-xs mt-1 p-3 bg-muted rounded overflow-auto">
                  {JSON.stringify(selectedSuggestion.originalValue || {}, null, 2)}
                </pre>
              </div>
              <div>
                <Label>Suggested Value</Label>
                <pre className="text-xs mt-1 p-3 bg-muted rounded overflow-auto">
                  {JSON.stringify(selectedSuggestion.suggestedValue, null, 2)}
                </pre>
              </div>
              {selectedSuggestion.entityId && getEntityLink(selectedSuggestion) && (
                <div>
                  <Link
                    href={getEntityLink(selectedSuggestion)!}
                    className="text-blue-600 hover:underline"
                  >
                    View {selectedSuggestion.entityType}
                  </Link>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
              Close
            </Button>
            {selectedSuggestion && selectedSuggestion.status === 'APPROVED' && (
              <Button
                onClick={() => {
                  applyMutation.mutate(selectedSuggestion.id);
                }}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Suggestion'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



