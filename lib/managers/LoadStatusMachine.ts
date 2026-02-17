import { LoadStatus } from '@prisma/client';

/**
 * LoadStatusMachine
 * 
 * Enforces valid state transitions for loads to prevent data corruption
 * and invalid workflow sequences.
 */
export class LoadStatusMachine {
    private static readonly VALID_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
        PENDING: ['ASSIGNED', 'CANCELLED'],
        ASSIGNED: ['PENDING', 'EN_ROUTE_PICKUP', 'CANCELLED'],
        EN_ROUTE_PICKUP: ['AT_PICKUP', 'CANCELLED'],
        AT_PICKUP: ['LOADED', 'CANCELLED'],
        LOADED: ['EN_ROUTE_DELIVERY', 'CANCELLED'],
        EN_ROUTE_DELIVERY: ['AT_DELIVERY', 'CANCELLED'],
        AT_DELIVERY: ['DELIVERED', 'CANCELLED'],
        DELIVERED: ['BILLING_HOLD', 'READY_TO_BILL', 'INVOICED'],
        BILLING_HOLD: ['READY_TO_BILL', 'DELIVERED'],
        READY_TO_BILL: ['INVOICED', 'BILLING_HOLD'],
        INVOICED: ['PAID'],
        PAID: [],
        CANCELLED: ['PENDING'], // Allow re-opening cancelled loads
    };

    /**
     * Validates if a transition from currentStatus to nextStatus is allowed.
     */
    static isValidTransition(currentStatus: LoadStatus, nextStatus: LoadStatus): boolean {
        // If status is the same, it's always valid (no change)
        if (currentStatus === nextStatus) return true;

        const allowed = this.VALID_TRANSITIONS[currentStatus];
        return allowed ? allowed.includes(nextStatus) : false;
    }

    /**
     * Gets all possible next statuses for a given current status.
     */
    static getAllowedNextStatuses(currentStatus: LoadStatus): LoadStatus[] {
        return this.VALID_TRANSITIONS[currentStatus] || [];
    }

    /**
     * Helper to check if a load is in an "active" state (before delivery)
     */
    static isActive(status: LoadStatus): boolean {
        return [
            'PENDING',
            'ASSIGNED',
            'EN_ROUTE_PICKUP',
            'AT_PICKUP',
            'LOADED',
            'EN_ROUTE_DELIVERY',
            'AT_DELIVERY'
        ].includes(status);
    }

    /**
     * Helper to check if a load is in a "terminal" state (completed or cancelled)
     */
    static isTerminal(status: LoadStatus): boolean {
        return ['PAID', 'CANCELLED'].includes(status);
    }
}
