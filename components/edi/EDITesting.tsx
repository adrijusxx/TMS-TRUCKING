'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

async function parseEDI(content: string) {
  const response = await fetch(apiUrl('/api/edi/parse'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to parse EDI');
  }
  return response.json();
}

export default function EDITesting() {
  const [ediContent, setEdiContent] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);

  const parseMutation = useMutation({
    mutationFn: () => parseEDI(ediContent),
    onSuccess: (data) => {
      toast.success('EDI file parsed successfully');
      setParsedData(data.data);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to parse EDI file');
      setParsedData(null);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setEdiContent(content);
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    if (!ediContent.trim()) {
      toast.error('Please enter or upload EDI content');
      return;
    }
    parseMutation.mutate();
  };

  const validateEDI = (content: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!content.trim()) {
      errors.push('EDI content is empty');
      return { valid: false, errors };
    }

    // Check for ISA segment
    if (!content.includes('ISA')) {
      errors.push('Missing ISA (Interchange Header) segment');
    }

    // Check for GS segment
    if (!content.includes('GS')) {
      errors.push('Missing GS (Functional Group Header) segment');
    }

    // Check for ST segment
    if (!content.includes('ST')) {
      errors.push('Missing ST (Transaction Set Header) segment');
    }

    // Check for SE segment
    if (!content.includes('SE')) {
      errors.push('Missing SE (Transaction Set Trailer) segment');
    }

    // Check for IEA segment
    if (!content.includes('IEA')) {
      errors.push('Missing IEA (Interchange Trailer) segment');
    }

    return { valid: errors.length === 0, errors };
  };

  const validation = validateEDI(ediContent);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="parse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="parse">Parse EDI</TabsTrigger>
          <TabsTrigger value="validate">Validate EDI</TabsTrigger>
        </TabsList>

        <TabsContent value="parse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parse EDI File</CardTitle>
              <CardDescription>
                Upload or paste EDI content to parse and view structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ediFile">Upload EDI File</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="ediFile"
                    type="file"
                    accept=".edi,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="ediFile">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </span>
                    </Button>
                  </label>
                  <span className="text-sm text-muted-foreground">
                    or paste content below
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ediContent">EDI Content</Label>
                <Textarea
                  id="ediContent"
                  value={ediContent}
                  onChange={(e) => setEdiContent(e.target.value)}
                  placeholder="Paste EDI content here..."
                  rows={15}
                  className="font-mono text-xs"
                />
              </div>

              <Button
                onClick={handleParse}
                disabled={parseMutation.isPending || !ediContent.trim()}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                {parseMutation.isPending ? 'Parsing...' : 'Parse EDI'}
              </Button>

              {parsedData && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Parsed Results</h3>
                    <Badge variant="outline">
                      Type: {parsedData.type}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Total Segments: {parsedData.segmentCount}
                    </p>

                    <div className="max-h-96 overflow-y-auto border rounded p-3 bg-background">
                      <div className="space-y-1">
                        {parsedData.segments.slice(0, 50).map((segment: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-xs font-mono p-1 hover:bg-muted rounded"
                          >
                            <span className="font-bold text-blue-600">{segment.id}</span>
                            {segment.elements.length > 0 && (
                              <span className="text-muted-foreground ml-2">
                                {segment.elements.join(' | ')}
                              </span>
                            )}
                          </div>
                        ))}
                        {parsedData.segments.length > 50 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ... and {parsedData.segments.length - 50} more segments
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validate EDI File</CardTitle>
              <CardDescription>
                Check EDI file structure and required segments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="validateContent">EDI Content</Label>
                <Textarea
                  id="validateContent"
                  value={ediContent}
                  onChange={(e) => setEdiContent(e.target.value)}
                  placeholder="Paste EDI content to validate..."
                  rows={15}
                  className="font-mono text-xs"
                />
              </div>

              {ediContent && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {validation.valid ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">
                          EDI File is Valid
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">
                          EDI File has Errors
                        </span>
                      </>
                    )}
                  </div>

                  {validation.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Validation Errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error, idx) => (
                          <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.valid && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        All required segments are present. EDI file structure is valid.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

