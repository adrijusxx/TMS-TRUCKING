'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { FieldStatusBadge, type FieldStatus } from './FieldStatusBadge';
import { ConfidenceBadge, type ConfidenceLevel } from './ConfidenceBadge';
import {
  CRITICAL_FIELDS,
  IMPORTANT_FIELDS,
  DETAIL_FIELDS,
  getFieldDisplayName,
} from './constants';

export interface ExtractionMeta {
  customerMatched?: boolean;
  customerCreated?: boolean;
  extractedFields?: number;
  confidence?: ConfidenceLevel;
  accountingWarnings?: string[];
}

export interface ExtractedData {
  [key: string]: unknown;
  customerId?: string;
}

interface ExtractionResultsPreviewProps {
  extractedData: ExtractedData;
  extractionMeta: ExtractionMeta;
  onReExtract: () => void;
  onUseData: () => void;
  isReExtracting: boolean;
}

export function ExtractionResultsPreview({
  extractedData,
  extractionMeta,
  onReExtract,
  onUseData,
  isReExtracting,
}: ExtractionResultsPreviewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getFieldStatus = (field: string): FieldStatus => {
    const value = extractedData[field];
    const hasValue = value !== undefined && value !== null && value !== '';

    if (hasValue) return 'extracted';
    if (CRITICAL_FIELDS.includes(field)) return 'missing-critical';
    if (IMPORTANT_FIELDS.includes(field)) return 'missing-important';
    return 'missing';
  };

  const confidence = extractionMeta.confidence || 'medium';

  return (
    <div className="space-y-4">
      {/* Confidence Header */}
      <div
        className={cn(
          'p-4 rounded-lg border',
          confidence === 'high'
            ? 'bg-green-50 border-green-200'
            : confidence === 'medium'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles
              className={cn(
                'h-4 w-4',
                confidence === 'high'
                  ? 'text-green-700'
                  : confidence === 'medium'
                    ? 'text-yellow-700'
                    : 'text-red-700'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                confidence === 'high'
                  ? 'text-green-700'
                  : confidence === 'medium'
                    ? 'text-yellow-700'
                    : 'text-red-700'
              )}
            >
              Data Extraction Complete
            </span>
          </div>
          <ConfidenceBadge confidence={confidence} />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="bg-white">
            {extractionMeta.extractedFields || 0} fields extracted
          </Badge>
          {extractionMeta.customerMatched && (
            <Badge variant="outline" className="bg-white text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Customer matched
            </Badge>
          )}
          {extractionMeta.customerCreated && (
            <Badge variant="outline" className="bg-white text-blue-700">
              New customer created
            </Badge>
          )}
        </div>

        {/* Accounting Warnings */}
        {extractionMeta.accountingWarnings &&
          extractionMeta.accountingWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-3">
              <p className="text-sm font-medium text-amber-800 mb-2">
                Accounting Warnings:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                {extractionMeta.accountingWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

        {/* Field Status Preview */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
            >
              <span>View Extraction Details</span>
              <span className="text-xs text-muted-foreground">
                {showDetails ? '▲' : '▼'}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Critical Fields */}
            <div>
              <p className="text-sm font-medium mb-2">
                Critical Fields (Required for Invoicing):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CRITICAL_FIELDS.map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <span className="text-sm">{getFieldDisplayName(field)}</span>
                    <FieldStatusBadge status={getFieldStatus(field)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Important Fields */}
            <div>
              <p className="text-sm font-medium mb-2">Location Fields:</p>
              <div className="grid grid-cols-2 gap-2">
                {IMPORTANT_FIELDS.map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <span className="text-sm">{getFieldDisplayName(field)}</span>
                    <FieldStatusBadge status={getFieldStatus(field)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Fields */}
            <div>
              <p className="text-sm font-medium mb-2">Additional Details:</p>
              <div className="grid grid-cols-2 gap-2">
                {DETAIL_FIELDS.map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <span className="text-sm">{getFieldDisplayName(field)}</span>
                    <FieldStatusBadge status={getFieldStatus(field)} />
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onReExtract}
          disabled={isReExtracting}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-Extract
        </Button>
        <Button type="button" onClick={onUseData} className="flex-1" size="lg">
          Use Extracted Data
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}





