/**
 * Simple event emitter for real-time updates
 * Can be extended to use Redis pub/sub for multi-instance deployments
 */

type EventCallback = (data: unknown) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event type
   */
  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.off(eventType, callback);
    };
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(eventType: string, data: unknown): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${eventType}:`, error);
        }
      });
    }

    // Also emit to 'all' subscribers
    const allCallbacks = this.listeners.get('all');
    if (allCallbacks) {
      allCallbacks.forEach((callback) => {
        try {
          callback({ type: eventType, data });
        } catch (error) {
          console.error(`Error in 'all' event callback:`, error);
        }
      });
    }
  }

  /**
   * Get number of listeners for an event type
   */
  listenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}

// Singleton instance
export const eventEmitter = new EventEmitter();

// Event types
export const EventTypes = {
  LOAD_STATUS_CHANGED: 'load:status:changed',
  LOAD_ASSIGNED: 'load:assigned',
  LOAD_DELIVERED: 'load:delivered',
  DRIVER_LOCATION_UPDATED: 'driver:location:updated',
  DISPATCH_UPDATED: 'dispatch:updated',
  BREAKDOWN_REPORTED: 'breakdown:reported',
  BREAKDOWN_RESOLVED: 'breakdown:resolved',
  INVOICE_CREATED: 'invoice:created',
  INVOICE_PAID: 'invoice:paid',
  SETTLEMENT_GENERATED: 'settlement:generated',
  NOTIFICATION: 'notification',
} as const;























