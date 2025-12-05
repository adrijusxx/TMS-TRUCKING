'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export type FieldStatus = 'extracted' | 'missing-critical' | 'missing-important' | 'missing';

interface FieldStatusBadgeProps {
  status: FieldStatus;
}

export function FieldStatusBadge({ status }: FieldStatusBadgeProps) {
  switch (status) {
    case 'extracted':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Extracted
        </Badge>
      );
    case 'missing-critical':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Required
        </Badge>
      );
    case 'missing-important':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Recommended
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
          Missing
        </Badge>
      );
  }
}





