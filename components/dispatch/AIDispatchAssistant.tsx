'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface DispatchRecommendation {
  loadId: string;
  loadNumber: string;
  priority: number;
  priorityReason: string;
  recommendedDriverId?: string;
  recommendedDriverName?: string;
  recommendedTruckId?: string;
  recommendedTruckNumber?: string;
  conflicts: string[];
  estimatedProfitability: number;
  estimatedDeliveryTime: string;
  recommendations: string[];
}

async function fetchDispatchRecommendations(date?: string): Promise<DispatchRecommendation[]> {
  const params = new URLSearchParams();
  if (date) params.append('date', date);

  const response = await fetch(`/api/ai/dispatch-assistant?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dispatch recommendations');
  }
  const data = await response.json();
  return data.data;
}

export default function AIDispatchAssistant({ companyId }: { companyId: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['ai-dispatch-assistant', selectedDate],
    queryFn: () => fetchDispatchRecommendations(selectedDate),
    enabled: !!companyId,
  });

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 6) return 'bg-orange-100 text-orange-800';
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Dispatch Assistant
            </CardTitle>
            <CardDescription>
              Intelligent load prioritization and conflict detection
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations
              .sort((a, b) => b.priority - a.priority)
              .map((rec) => (
                <Card key={rec.loadId} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link
                            href={`/dashboard/loads/${rec.loadId}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            Load {rec.loadNumber}
                          </Link>
                          <Badge className={getPriorityColor(rec.priority)}>
                            Priority: {rec.priority}/10
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.priorityReason}</p>

                        {rec.conflicts.length > 0 && (
                          <Alert className="mb-2 border-orange-200">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription>
                              <strong>Conflicts detected:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {rec.conflicts.map((conflict, idx) => (
                                  <li key={idx} className="text-sm">{conflict}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          {rec.recommendedDriverName && (
                            <div>
                              <span className="text-muted-foreground">Recommended Driver: </span>
                              <span className="font-medium">{rec.recommendedDriverName}</span>
                            </div>
                          )}
                          {rec.recommendedTruckNumber && (
                            <div>
                              <span className="text-muted-foreground">Recommended Truck: </span>
                              <span className="font-medium">{rec.recommendedTruckNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>Est. Profit: ${rec.estimatedProfitability.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              Est. Delivery: {new Date(rec.estimatedDeliveryTime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {rec.recommendations.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Recommendations:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {rec.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No dispatch recommendations available
          </div>
        )}
      </CardContent>
    </Card>
  );
}



