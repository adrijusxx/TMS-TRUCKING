'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, User, Truck, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface LoadMatchRecommendation {
  driverId: string;
  driverNumber: string;
  driverName: string;
  truckId?: string;
  truckNumber?: string;
  matchScore: number;
  reasoning: string;
  factors: {
    locationProximity?: number;
    equipmentCompatibility?: boolean;
    historicalPerformance?: number;
    hosCompliance?: boolean;
    driverPreference?: number;
  };
}

interface AILoadRecommendationsProps {
  loadId: string;
  availableDriverIds?: string[];
  availableTruckIds?: string[];
  onSelectMatch?: (driverId: string, truckId?: string) => void;
}

export default function AILoadRecommendations({
  loadId,
  availableDriverIds,
  availableTruckIds,
  onSelectMatch,
}: AILoadRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<LoadMatchRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const getMatchMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(apiUrl('/api/ai/load-matching'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadId,
          availableDriverIds,
          availableTruckIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get recommendations');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations);
    },
    onError: (error: Error) => {
      toast.error('Failed to get AI recommendations', {
        description: error.message,
      });
    },
  });

  const handleGetRecommendations = () => {
    setLoading(true);
    getMatchMutation.mutate();
    setTimeout(() => setLoading(false), 1000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  if (!recommendations && !loading && !getMatchMutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Load Matching
          </CardTitle>
          <CardDescription>
            Get intelligent recommendations for matching this load to drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetRecommendations} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Get AI Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading || getMatchMutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Load Matching
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Load Matching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recommendations available</p>
          <Button onClick={handleGetRecommendations} variant="outline" className="mt-4 w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Load Matching Recommendations
        </CardTitle>
        <CardDescription>
          Top {recommendations.length} matches ranked by compatibility score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={rec.driverId}
            className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getScoreColor(rec.matchScore)}>
                    #{index + 1} - {rec.matchScore}% Match
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{rec.driverName}</span>
                    <span className="text-muted-foreground">({rec.driverNumber})</span>
                  </div>
                  {rec.truckNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Truck {rec.truckNumber}</span>
                    </div>
                  )}
                </div>
              </div>
              {onSelectMatch && (
                <Button
                  size="sm"
                  onClick={() => onSelectMatch(rec.driverId, rec.truckId)}
                >
                  Select
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{rec.reasoning}</p>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {rec.factors.equipmentCompatibility && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Equipment Match
                </Badge>
              )}
              {rec.factors.hosCompliance && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  HOS Compliant
                </Badge>
              )}
              {rec.factors.locationProximity !== undefined && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {rec.factors.locationProximity}% Proximity
                </Badge>
              )}
              {rec.factors.historicalPerformance !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {rec.factors.historicalPerformance}% Performance
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

