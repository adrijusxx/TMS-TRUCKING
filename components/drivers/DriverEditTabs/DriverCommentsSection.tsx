'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface DriverCommentsSectionProps {
  driver: any;
}

export default function DriverCommentsSection({ driver }: DriverCommentsSectionProps) {
  const [comments, setComments] = useState(driver.comments || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleAdd = async () => {
    if (!newComment.trim()) return;

    // In a real implementation, this would call an API
    const comment = {
      id: `temp-${Date.now()}`,
      comment: newComment,
      createdBy: {
        firstName: 'Current',
        lastName: 'User',
      },
      createdAt: new Date(),
    };

    setComments([comment, ...comments]);
    setNewComment('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add comment
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Textarea
                placeholder="Enter comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button type="button" onClick={handleAdd} size="sm">
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setNewComment('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet
          </p>
        ) : (
          comments.map((comment: any) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {comment.createdBy?.firstName} {comment.createdBy?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

