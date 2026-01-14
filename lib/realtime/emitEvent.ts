import { eventEmitter, EventTypes } from './EventEmitter';
import { logger } from '@/lib/utils/logger';

/**
 * Emit a real-time event
 * This should be called from API routes or services when events occur
 */
export function emitEvent(eventType: string, data: unknown): void {
  logger.info('Emitting real-time event', { eventType, hasData: !!data });
  eventEmitter.emit(eventType, {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Convenience functions for common events
 */
export const emitLoadStatusChanged = (loadId: string, status: string, load: unknown) => {
  emitEvent(EventTypes.LOAD_STATUS_CHANGED, { loadId, status, load });
};

export const emitLoadAssigned = (loadId: string, driverId: string, load: unknown) => {
  emitEvent(EventTypes.LOAD_ASSIGNED, { loadId, driverId, load });
};

export const emitLoadDelivered = (loadId: string, load: unknown) => {
  emitEvent(EventTypes.LOAD_DELIVERED, { loadId, load });
};

export const emitDispatchUpdated = (updates: unknown) => {
  emitEvent(EventTypes.DISPATCH_UPDATED, updates);
};

export const emitBreakdownReported = (breakdownId: string, breakdown: unknown) => {
  emitEvent(EventTypes.BREAKDOWN_REPORTED, { breakdownId, breakdown });
};

export const emitBreakdownResolved = (breakdownId: string, breakdown: unknown) => {
  emitEvent(EventTypes.BREAKDOWN_RESOLVED, { breakdownId, breakdown });
};

export const emitInvoiceCreated = (invoiceId: string, invoice: unknown) => {
  emitEvent(EventTypes.INVOICE_CREATED, { invoiceId, invoice });
};

export const emitSettlementGenerated = (settlementId: string, settlement: unknown) => {
  emitEvent(EventTypes.SETTLEMENT_GENERATED, { settlementId, settlement });
};
























