'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  switch (confidence) {
    case 'high':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          High Confidence
        </Badge>
      );
    case 'medium':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Medium Confidence
        </Badge>
      );
    case 'low':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Low Confidence
        </Badge>
      );
  }
}





