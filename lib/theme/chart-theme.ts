import { LoadStatus } from '@prisma/client';

/**
 * Centralized chart color palette conforming to the design system.
 * These hex codes should ideally map to CSS variables in the future,
 * but for Recharts, we often need raw hex values.
 */
export const CHART_COLORS = {
    // Status Colors
    status: {
        pending: '#eab308', // yellow-500
        assigned: '#3b82f6', // blue-500
        active: '#a855f7', // purple-500
        success: '#10b981', // green-500
        warning: '#f59e0b', // amber-500
        error: '#ef4444', // red-500
        info: '#06b6d4', // cyan-500
        neutral: '#6b7280', // gray-500
    },
    // Semantic mappings
    loadStatus: {
        PENDING: '#eab308', // yellow-500
        ASSIGNED: '#3b82f6', // blue-500
        EN_ROUTE_PICKUP: '#a855f7', // purple-500
        AT_PICKUP: '#f97316', // orange-500
        LOADED: '#6366f1', // indigo-500
        EN_ROUTE_DELIVERY: '#06b6d4', // cyan-500
        AT_DELIVERY: '#ec4899', // pink-500
        DELIVERED: '#10b981', // green-500
        BILLING_HOLD: '#f59e0b', // amber-500
        READY_TO_BILL: '#22c55e', // green-500
        INVOICED: '#059669', // emerald-600
        PAID: '#14b8a6', // teal-500
        CANCELLED: '#ef4444', // red-500
    } as Record<LoadStatus, string>
};

export const CHART_LABELS = {
    loadStatus: {
        PENDING: 'Pending',
        ASSIGNED: 'Assigned',
        EN_ROUTE_PICKUP: 'En Route Pickup',
        AT_PICKUP: 'At Pickup',
        LOADED: 'Loaded',
        EN_ROUTE_DELIVERY: 'En Route Delivery',
        AT_DELIVERY: 'At Delivery',
        DELIVERED: 'Delivered',
        BILLING_HOLD: 'Billing Hold',
        READY_TO_BILL: 'Ready to Bill',
        INVOICED: 'Invoiced',
        PAID: 'Paid',
        CANCELLED: 'Cancelled',
    } as Record<LoadStatus, string>
};
