'use client';

import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { MissingFieldWarning } from '@/lib/validations/import-field-validator';

interface ImportFieldWarningsProps {
  missingRequiredFields: MissingFieldWarning[];
  missingOptionalFields: MissingFieldWarning[];
  csvHeaders: string[];
  onFieldMapping?: (fieldName: string, csvHeader: string) => void;
}

export default function ImportFieldWarnings({
  missingRequiredFields,
  missingOptionalFields,
  csvHeaders,
  onFieldMapping,
}: ImportFieldWarningsProps) {
  const criticalErrors = missingRequiredFields.filter(f => f.severity === 'error');
  const warnings = missingRequiredFields.filter(f => f.severity === 'warning');
  const hasCriticalIssues = criticalErrors.length > 0;

  if (criticalErrors.length === 0 && warnings.length === 0 && missingOptionalFields.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">All Required Fields Present</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Your import file contains all required fields. The import should complete successfully.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Errors - Will Cause Import Failure */}
      {criticalErrors.length > 0 && (
        <Alert className="border-red-300 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200 flex items-center justify-between">
            <span>⚠️ Critical: Missing Required Fields ({criticalErrors.length})</span>
            <Badge variant="destructive" className="ml-2">
              Import Will Fail
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
            <p className="mb-3 font-medium">
              These fields are <strong>REQUIRED</strong> by the database. Your import will <strong>FAIL</strong> without them.
            </p>
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="mb-3">
                  View Missing Fields ({criticalErrors.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {criticalErrors.map((field, index) => (
                  <div
                    key={index}
                    className="border border-red-200 rounded-lg p-3 bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-red-800 dark:text-red-200">
                            {field.fieldName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {field.fieldType}
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          This field is required but not found in your CSV/Excel file.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                          What Will Break:
                        </p>
                        <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 ml-4 list-disc">
                          {field.potentialIssues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Suggested CSV Column Names:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {field.suggestedCsvHeaders.slice(0, 5).map((header, i) => {
                            const isInFile = csvHeaders.some(h => 
                              h.toLowerCase().trim() === header.toLowerCase().trim()
                            );
                            return (
                              <Badge
                                key={i}
                                variant={isInFile ? "default" : "outline"}
                                className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                                onClick={() => {
                                  if (!isInFile && onFieldMapping) {
                                    // Find closest match in CSV
                                    const closest = csvHeaders.find(h => 
                                      h.toLowerCase().includes(header.toLowerCase().substring(0, 3)) ||
                                      header.toLowerCase().includes(h.toLowerCase().substring(0, 3))
                                    );
                                    if (closest) {
                                      onFieldMapping(field.fieldName, closest);
                                    }
                                  }
                                }}
                              >
                                {header}
                                {isInFile && <CheckCircle2 className="h-3 w-3 ml-1" />}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings - Has Defaults But Should Import */}
      {warnings.length > 0 && (
        <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            ⚠️ Recommended: Fields with Defaults ({warnings.length})
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300 mt-2">
            <p className="mb-3">
              These fields have default values, so import will work, but you should import them for accurate data.
            </p>
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="mb-3">
                  View Fields ({warnings.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {warnings.map((field, index) => (
                  <div
                    key={index}
                    className="border border-yellow-200 rounded p-2 bg-white dark:bg-gray-900 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{field.fieldName}</span>
                      <Badge variant="outline" className="text-xs">
                        Default: {field.defaultValue || 'system default'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {field.potentialIssues[0]}
                    </p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </AlertDescription>
        </Alert>
      )}

      {/* Optional Fields - Nice to Have */}
      {missingOptionalFields.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/30">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            ℹ️ Optional Fields ({missingOptionalFields.length})
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300 mt-2">
            <p className="mb-2">
              These optional fields are not in your import file. Import will work without them, but consider adding them for complete data.
            </p>
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="mb-2">
                  View Optional Fields ({missingOptionalFields.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-1 mt-2">
                  {missingOptionalFields.slice(0, 20).map((field, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {field.fieldName}
                    </Badge>
                  ))}
                  {missingOptionalFields.length > 20 && (
                    <Badge variant="outline" className="text-xs">
                      +{missingOptionalFields.length - 20} more
                    </Badge>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Action */}
      {hasCriticalIssues && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                Action Required Before Import
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                You must add the missing required fields to your CSV/Excel file or map them using the Column Mapping tool.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" asChild>
                  <a href="#column-mapping" onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('column-mapping-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Open Column Mapping
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="/docs/import-field-requirements.html" 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Field Requirements
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



