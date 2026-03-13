'use client';

import { ArrowRight, Check, Truck, Container, UserCheck, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface SuggestionData {
  id: string;
  suggestionType: 'TRUCK_CHANGE' | 'TRAILER_CHANGE' | 'DISPATCHER_LINK' | 'NEW_ASSIGNMENT';
  loadCount: number;
  confidence: number;
  currentTruckId: string | null;
  currentTrailerId: string | null;
  currentDispatcherId: string | null;
  driver: {
    id: string;
    driverNumber: string;
    user: { firstName: string; lastName: string };
  };
  suggestedTruck?: { id: string; truckNumber: string } | null;
  suggestedTrailer?: { id: string; trailerNumber: string } | null;
  suggestedDispatcher?: { id: string; firstName: string; lastName: string } | null;
}

interface SuggestionCardProps {
  suggestion: SuggestionData;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  isLoading?: boolean;
}

const TYPE_CONFIG = {
  TRUCK_CHANGE: { icon: Truck, label: 'Truck Change', color: 'text-blue-600' },
  TRAILER_CHANGE: { icon: Container, label: 'Trailer Change', color: 'text-orange-600' },
  DISPATCHER_LINK: { icon: UserCheck, label: 'Dispatcher Link', color: 'text-purple-600' },
  NEW_ASSIGNMENT: { icon: Plus, label: 'New Assignment', color: 'text-green-600' },
} as const;

export function SuggestionCard({ suggestion, onAccept, onDismiss, isLoading }: SuggestionCardProps) {
  const config = TYPE_CONFIG[suggestion.suggestionType];
  const Icon = config.icon;
  const driverName = `${suggestion.driver.user.firstName} ${suggestion.driver.user.lastName}`;

  const getSuggestedLabel = () => {
    if (suggestion.suggestedTruck) return suggestion.suggestedTruck.truckNumber;
    if (suggestion.suggestedTrailer) return suggestion.suggestedTrailer.trailerNumber;
    if (suggestion.suggestedDispatcher) {
      return `${suggestion.suggestedDispatcher.firstName} ${suggestion.suggestedDispatcher.lastName}`;
    }
    return 'Unknown';
  };

  const getCurrentLabel = () => {
    if (suggestion.suggestionType === 'TRUCK_CHANGE' || suggestion.suggestionType === 'NEW_ASSIGNMENT') {
      return suggestion.currentTruckId ? 'Current truck' : 'No truck';
    }
    if (suggestion.suggestionType === 'TRAILER_CHANGE') {
      return suggestion.currentTrailerId ? 'Current trailer' : 'No trailer';
    }
    if (suggestion.suggestionType === 'DISPATCHER_LINK') {
      return 'No dispatcher';
    }
    return 'None';
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
      <div className={`shrink-0 ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{driverName}</span>
          <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">{suggestion.driver.driverNumber}</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{getCurrentLabel()}</span>
          <ArrowRight className="w-3 h-3 shrink-0" />
          <span className="font-medium text-foreground truncate">{getSuggestedLabel()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className="text-[10px] h-5">
          {suggestion.loadCount} loads &middot; {suggestion.confidence}%
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDismiss(suggestion.id)}
          disabled={isLoading}
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => onAccept(suggestion.id)}
          disabled={isLoading}
        >
          <Check className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
