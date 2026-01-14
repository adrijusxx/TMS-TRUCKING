'use client';

import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/utils';

type EventType = string;
type EventData = unknown;

interface RealtimeEvent {
  type: string;
  data?: EventData;
  timestamp: string;
}

interface UseRealtimeOptions {
  eventTypes?: string[];
  onEvent?: (event: RealtimeEvent) => void;
  enabled?: boolean;
}

/**
 * Hook for subscribing to real-time events via Server-Sent Events
 */
export function useRealtime(options: UseRealtimeOptions = {}) {
  const { eventTypes = ['all'], onEvent, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Build SSE URL
    const typesParam = eventTypes.join(',');
    const url = `${apiUrl(`/api/realtime/events?types=${typesParam}`)}`;

    // Create EventSource connection
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        setLastEvent(data);

        // Call custom handler if provided
        if (onEvent) {
          onEvent(data);
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [eventTypes.join(','), enabled, onEvent]);

  return {
    isConnected,
    lastEvent,
    reconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      // Trigger reconnection by updating enabled state
      setIsConnected(false);
    },
  };
}

/**
 * Hook for subscribing to specific event types
 */
export function useRealtimeLoads(onEvent?: (event: RealtimeEvent) => void) {
  return useRealtime({
    eventTypes: ['load:status:changed', 'load:assigned', 'load:delivered'],
    onEvent,
  });
}

/**
 * Hook for subscribing to dispatch updates
 */
export function useRealtimeDispatch(onEvent?: (event: RealtimeEvent) => void) {
  return useRealtime({
    eventTypes: ['dispatch:updated', 'load:assigned'],
    onEvent,
  });
}

/**
 * Hook for subscribing to breakdown events
 */
export function useRealtimeBreakdowns(onEvent?: (event: RealtimeEvent) => void) {
  return useRealtime({
    eventTypes: ['breakdown:reported', 'breakdown:resolved'],
    onEvent,
  });
}
























