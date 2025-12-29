'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiUrl } from '@/lib/utils';

interface DataQSubmissionFormProps {
  violationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DataQSubmissionForm({
  violationId,
  onSuccess,
  onCancel
}: DataQSubmissionFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    violationId: violationId || '',
    fmcsatrackingNumber: '',
    violationChallenged: '',
    reasonForChallenge: '',
    supportingDocumentIds: [] as string[]
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl('/api/safety/compliance/dataq'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to submit DataQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataq-submissions'] });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      violationId: formData.violationId || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DataQ Submission</CardTitle>
          <CardDescription>
            Challenge a violation through FMCSA DataQ system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!violationId && (
            <div className="space-y-2">
              <Label>Violation ID</Label>
              <Input
                value={formData.violationId}
                onChange={(e) => setFormData({ ...formData, violationId: e.target.value })}
                placeholder="Violation ID to challenge"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>FMCSA Tracking Number *</Label>
            <Input
              value={formData.fmcsatrackingNumber}
              onChange={(e) =>
                setFormData({ ...formData, fmcsatrackingNumber: e.target.value })
              }
              placeholder="FMCSA tracking number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Violation Challenged *</Label>
            <Input
              value={formData.violationChallenged}
              onChange={(e) =>
                setFormData({ ...formData, violationChallenged: e.target.value })
              }
              placeholder="Violation code or description"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reason for Challenge *</Label>
            <Textarea
              value={formData.reasonForChallenge}
              onChange={(e) =>
                setFormData({ ...formData, reasonForChallenge: e.target.value })
              }
              placeholder="Explain why this violation should be removed or corrected"
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Supporting Documents</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Upload supporting documents separately and enter document IDs here
            </div>
            <Input
              value={formData.supportingDocumentIds.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supportingDocumentIds: e.target.value
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id)
                })
              }
              placeholder="Document IDs (comma-separated)"
            />
          </div>

          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit DataQ'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

