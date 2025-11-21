'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, CheckCircle2, FileText } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface AnnualReview {
  id: string;
  reviewDate: string;
  dueDate: string;
  reviewYear: number;
  mvrReviewed: boolean;
  violationReviewed: boolean;
  accidentReviewed: boolean;
  trainingCompleted: boolean;
  performanceDiscussed: boolean;
  reviewNotes: string | null;
  performanceNotes: string | null;
  actionItems: string | null;
  status: string;
  documents: Array<{
    id: string;
    document: {
      id: string;
      fileName: string;
    };
  }>;
}

interface AnnualReviewFormProps {
  driverId: string;
  reviewId?: string;
  onSuccess?: () => void;
}

async function fetchReview(driverId: string, reviewId?: string) {
  if (reviewId) {
    // Fetch specific review - would need API endpoint
    return null;
  }
  const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/annual-review`));
  if (!response.ok) throw new Error('Failed to fetch annual reviews');
  return response.json() as Promise<{ reviews: AnnualReview[] }>;
}

export default function AnnualReviewForm({ driverId, reviewId, onSuccess }: AnnualReviewFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    reviewDate: new Date().toISOString().split('T')[0],
    reviewYear: new Date().getFullYear(),
    mvrReviewed: false,
    violationReviewed: false,
    accidentReviewed: false,
    trainingCompleted: false,
    performanceDiscussed: false,
    reviewNotes: '',
    performanceNotes: '',
    actionItems: '',
    status: 'PENDING'
  });

  const { data } = useQuery({
    queryKey: ['annual-reviews', driverId],
    queryFn: () => fetchReview(driverId, reviewId)
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/annual-review`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create annual review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annual-reviews', driverId] });
      onSuccess?.();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/annual-review`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, reviewId })
      });
      if (!response.ok) throw new Error('Failed to update annual review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annual-reviews', driverId] });
      onSuccess?.();
    }
  });

  useEffect(() => {
    if (reviewId && data?.reviews) {
      const review = data.reviews.find(r => r.id === reviewId);
      if (review) {
        setFormData({
          reviewDate: review.reviewDate.split('T')[0],
          reviewYear: review.reviewYear,
          mvrReviewed: review.mvrReviewed,
          violationReviewed: review.violationReviewed,
          accidentReviewed: review.accidentReviewed,
          trainingCompleted: review.trainingCompleted,
          performanceDiscussed: review.performanceDiscussed,
          reviewNotes: review.reviewNotes || '',
          performanceNotes: review.performanceNotes || '',
          actionItems: review.actionItems || '',
          status: review.status
        });
      }
    }
  }, [reviewId, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const allChecklistItemsComplete =
    formData.mvrReviewed &&
    formData.violationReviewed &&
    formData.accidentReviewed &&
    formData.trainingCompleted &&
    formData.performanceDiscussed;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{reviewId ? 'Edit Annual Review' : 'Annual Review'}</CardTitle>
          <CardDescription>
            Complete annual driver qualification review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Review Date *</Label>
              <Input
                type="date"
                value={formData.reviewDate}
                onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Review Year *</Label>
              <Input
                type="number"
                value={formData.reviewYear}
                onChange={(e) =>
                  setFormData({ ...formData, reviewYear: parseInt(e.target.value) })
                }
                required
              />
            </div>
          </div>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Checklist</CardTitle>
              <CardDescription>
                Complete all items for annual review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mvrReviewed"
                  checked={formData.mvrReviewed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, mvrReviewed: checked as boolean })
                  }
                />
                <Label htmlFor="mvrReviewed" className="font-normal cursor-pointer">
                  MVR Reviewed
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="violationReviewed"
                  checked={formData.violationReviewed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, violationReviewed: checked as boolean })
                  }
                />
                <Label htmlFor="violationReviewed" className="font-normal cursor-pointer">
                  Violations Reviewed
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accidentReviewed"
                  checked={formData.accidentReviewed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, accidentReviewed: checked as boolean })
                  }
                />
                <Label htmlFor="accidentReviewed" className="font-normal cursor-pointer">
                  Accidents Reviewed
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trainingCompleted"
                  checked={formData.trainingCompleted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, trainingCompleted: checked as boolean })
                  }
                />
                <Label htmlFor="trainingCompleted" className="font-normal cursor-pointer">
                  Training Completed
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="performanceDiscussed"
                  checked={formData.performanceDiscussed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, performanceDiscussed: checked as boolean })
                  }
                />
                <Label htmlFor="performanceDiscussed" className="font-normal cursor-pointer">
                  Performance Discussed
                </Label>
              </div>

              {allChecklistItemsComplete && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    All checklist items complete
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Review Notes</Label>
              <Textarea
                value={formData.reviewNotes}
                onChange={(e) => setFormData({ ...formData, reviewNotes: e.target.value })}
                placeholder="General review notes"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Performance Notes</Label>
              <Textarea
                value={formData.performanceNotes}
                onChange={(e) => setFormData({ ...formData, performanceNotes: e.target.value })}
                placeholder="Driver performance notes"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Action Items</Label>
              <Textarea
                value={formData.actionItems}
                onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                placeholder="Action items and follow-ups"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            {onSuccess && (
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : reviewId
                ? 'Update Review'
                : 'Complete Review'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

