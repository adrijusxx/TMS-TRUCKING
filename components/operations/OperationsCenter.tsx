'use client';

/**
 * Operations Center Component
 * 
 * Single unified map view for fleet operations.
 * Features clustering, hover cards, and feature layers.
 */

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic import for the unified map (no SSR for Google Maps)
const UnifiedWarRoom = dynamic(() => import('@/components/map/UnifiedWarRoom'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded border">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
        <span className="text-xs text-muted-foreground">Loading Operations Center...</span>
      </div>
    </div>
  ),
});

export default function OperationsCenter() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn(
      'relative',
      isFullscreen && 'fixed inset-0 z-50 bg-background p-2'
    )}>
      {/* Fullscreen Toggle (positioned outside map) */}
      {isFullscreen && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-50 h-7 text-xs px-2 bg-background shadow-md"
        >
          <Minimize2 className="h-3 w-3 mr-1" />
          Exit Fullscreen
        </Button>
      )}

      {/* Map Container */}
      <div className={cn(
        'rounded overflow-hidden',
        isFullscreen ? 'h-full' : 'h-[calc(100vh-180px)] min-h-[500px]'
      )}>
        <UnifiedWarRoom />
      </div>

      {/* Fullscreen button when not fullscreen (small floating button) */}
      {!isFullscreen && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 z-20 h-7 text-xs px-2 bg-background/90 shadow-md"
        >
          <Maximize2 className="h-3 w-3 mr-1" />
          Fullscreen
        </Button>
      )}
    </div>
  );
}
