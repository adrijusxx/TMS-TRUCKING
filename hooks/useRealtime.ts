'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '@/lib/utils';

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
  const onEventRef = useRef(onEvent);

  // Keep the ref up to date without triggering the effect
  onEventRef.current = onEvent;

  const typesKey = useMemo(() => eventTypes.join(','), [eventTypes.join(',')]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const url = `${apiUrl(`/api/realtime/events?types=${typesKey}`)}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        setLastEvent(data);
        onEventRef.current?.(data);
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [typesKey, enabled]);

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























