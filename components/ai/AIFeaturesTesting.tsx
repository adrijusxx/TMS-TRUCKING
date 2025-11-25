'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  responseTime?: number;
}

export default function AIFeaturesTesting() {
  const [results, setResults] = useState<Record<string, TestResult>>({});

  const testEndpoint = async (endpoint: string, payload: any, testName: string) => {
    const startTime = Date.now();
    try {
      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return {
        success: true,
        data: data.data || data,
        responseTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        responseTime: Date.now() - startTime,
      };
    }
  };

  const loadMatchingMutation = useMutation({
    mutationFn: async (loadId: string) => {
      return testEndpoint('/api/ai/load-matching', { loadId }, 'Load Matching');
    },
    onSuccess: (result) => {
      setResults(prev => ({ ...prev, 'load-matching': result }));
    },
  });

  const expenseCategorizationMutation = useMutation({
    mutationFn: async (description: string) => {
      return testEndpoint('/api/ai/expense-categorization', {
        description,
        vendor: 'Pilot Travel Center',
        amount: 450.00,
      }, 'Expense Categorization');
    },
    onSuccess: (result) => {
      setResults(prev => ({ ...prev, 'expense-categorization': result }));
    },
  });

  const routeOptimizationMutation = useMutation({
    mutationFn: async (loadIds: string[]) => {
      return testEndpoint('/api/ai/route-optimization', {
        loadIds,
        optimizationType: 'DISTANCE',
      }, 'Route Optimization');
    },
    onSuccess: (result) => {
      setResults(prev => ({ ...prev, 'route-optimization': result }));
    },
  });

  const rateRecommendationMutation = useMutation({
    mutationFn: async () => {
      return testEndpoint('/api/ai/rate-recommendations', {
        pickupCity: 'Los Angeles',
        pickupState: 'CA',
        deliveryCity: 'Dallas',
        deliveryState: 'TX',
        equipmentType: 'DRY_VAN',
        totalMiles: 1450,
      }, 'Rate Recommendations');
    },
    onSuccess: (result) => {
      setResults(prev => ({ ...prev, 'rate-recommendations': result }));
    },
  });

  const chatbotMutation = useMutation({
    mutationFn: async (message: string) => {
      return testEndpoint('/api/ai/chatbot', {
        message,
      }, 'Chatbot');
    },
    onSuccess: (result) => {
      setResults(prev => ({ ...prev, 'chatbot': result }));
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const renderResult = (testName: string, result: TestResult) => {
    if (!result) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {testName} Result
            </CardTitle>
            <div className="flex items-center gap-2">
              {result.success ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Success
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              )}
              {result.responseTime && (
                <Badge variant="outline">
                  {result.responseTime}ms
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {result.error ? (
            <div className="text-sm text-red-600">{result.error}</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Data:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI Features Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test all AI-powered features to verify they're working correctly
        </p>
      </div>

      <Tabs defaultValue="phase1" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="phase1">Phase 1</TabsTrigger>
          <TabsTrigger value="phase2">Phase 2</TabsTrigger>
          <TabsTrigger value="phase3">Phase 3</TabsTrigger>
          <TabsTrigger value="phase4">Phase 4</TabsTrigger>
        </TabsList>

        {/* Phase 1: High-Impact Features */}
        <TabsContent value="phase1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1. Intelligent Load Matching</CardTitle>
              <CardDescription>
                Test AI-powered load-to-driver matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Load ID</Label>
                <Input
                  id="load-id"
                  placeholder="Enter load ID to test matching"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const loadId = (e.target as HTMLInputElement).value;
                      if (loadId) loadMatchingMutation.mutate(loadId);
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => {
                  const loadId = (document.getElementById('load-id') as HTMLInputElement)?.value;
                  if (loadId) {
                    loadMatchingMutation.mutate(loadId);
                  } else {
                    toast.error('Please enter a load ID');
                  }
                }}
                disabled={loadMatchingMutation.isPending}
              >
                {loadMatchingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test Load Matching
                  </>
                )}
              </Button>
              {renderResult('Load Matching', results['load-matching'])}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Expense Auto-Categorization</CardTitle>
              <CardDescription>
                Test automatic expense categorization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Expense Description</Label>
                <Textarea
                  id="expense-desc"
                  placeholder="e.g., Fuel purchase at Pilot Travel Center"
                  defaultValue="Fuel purchase at Pilot Travel Center"
                />
              </div>
              <Button
                onClick={() => {
                  const desc = (document.getElementById('expense-desc') as HTMLTextAreaElement)?.value;
                  if (desc) {
                    expenseCategorizationMutation.mutate(desc);
                  }
                }}
                disabled={expenseCategorizationMutation.isPending}
              >
                {expenseCategorizationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test Categorization
                  </>
                )}
              </Button>
              {renderResult('Expense Categorization', results['expense-categorization'])}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase 2: Operational Efficiency */}
        <TabsContent value="phase2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Optimization</CardTitle>
              <CardDescription>
                Test AI-powered route optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Load IDs (comma-separated, at least 2)</Label>
                <Input
                  id="route-loads"
                  placeholder="load_id_1, load_id_2, load_id_3"
                />
              </div>
              <Button
                onClick={() => {
                  const loadIdsStr = (document.getElementById('route-loads') as HTMLInputElement)?.value;
                  const loadIds = loadIdsStr.split(',').map(id => id.trim()).filter(Boolean);
                  if (loadIds.length >= 2) {
                    routeOptimizationMutation.mutate(loadIds);
                  } else {
                    toast.error('Please enter at least 2 load IDs');
                  }
                }}
                disabled={routeOptimizationMutation.isPending}
              >
                {routeOptimizationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test Route Optimization
                  </>
                )}
              </Button>
              {renderResult('Route Optimization', results['route-optimization'])}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Recommendations</CardTitle>
              <CardDescription>
                Test AI-powered rate suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => rateRecommendationMutation.mutate()}
                disabled={rateRecommendationMutation.isPending}
              >
                {rateRecommendationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test Rate Recommendations (LA → Dallas)
                  </>
                )}
              </Button>
              {renderResult('Rate Recommendations', results['rate-recommendations'])}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase 3: Advanced Analytics */}
        <TabsContent value="phase3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics Features</CardTitle>
              <CardDescription>
                Safety prediction, anomaly detection, forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                These features require specific entity IDs (driver/truck) and historical data.
                Test them from their respective pages (safety page, analytics dashboard, etc.)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase 4: Customer Experience */}
        <TabsContent value="phase4" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Service Chatbot</CardTitle>
              <CardDescription>
                Test AI chatbot responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Message</Label>
                <Textarea
                  id="chatbot-message"
                  placeholder="e.g., What's the status of load LOAD-123?"
                  defaultValue="What's the status of load LOAD-001?"
                />
              </div>
              <Button
                onClick={() => {
                  const message = (document.getElementById('chatbot-message') as HTMLTextAreaElement)?.value;
                  if (message) {
                    chatbotMutation.mutate(message);
                  }
                }}
                disabled={chatbotMutation.isPending}
              >
                {chatbotMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test Chatbot
                  </>
                )}
              </Button>
              {renderResult('Chatbot', results['chatbot'])}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Testing Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Ensure you have test data in your database (loads, drivers, trucks, invoices)</p>
          <p>• Check that DEEPSEEK_API_KEY is set in your .env file</p>
          <p>• Response times may vary (typically 2-5 seconds for AI calls)</p>
          <p>• Some features require historical data to work effectively</p>
          <p>• See <code>docs/AI_FEATURES_TESTING.md</code> for detailed testing instructions</p>
        </CardContent>
      </Card>
    </div>
  );
}



