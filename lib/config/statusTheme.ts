/**
 * Unified Status Theme Configuration
 * Single source of truth for all status-related colors and styling
 */

import { LoadStatus, LoadDispatchStatus } from '@prisma/client';

// =============================================================================
// LOAD STATUS THEME
// =============================================================================

export interface StatusTheme {
  bg: string;
  text: string;
  border: string;
  className: string;
  icon?: string;
}

export const loadStatusTheme: Record<LoadStatus, StatusTheme> = {
  PENDING: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  ASSIGNED: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  EN_ROUTE_PICKUP: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  AT_PICKUP: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  LOADED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  EN_ROUTE_DELIVERY: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-200',
    className: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  AT_DELIVERY: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    className: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  DELIVERED: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  BILLING_HOLD: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  READY_TO_BILL: {
    bg: 'bg-lime-100',
    text: 'text-lime-800',
    border: 'border-lime-200',
    className: 'bg-lime-100 text-lime-800 border-lime-200',
  },
  INVOICED: {
    bg: 'bg-lime-100',
    text: 'text-lime-800',
    border: 'border-lime-200',
    className: 'bg-lime-100 text-lime-800 border-lime-200',
  },
  PAID: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELLED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

/**
 * Get status colors for a load status (returns className string)
 */
export function getLoadStatusColors(status: LoadStatus): string {
  return loadStatusTheme[status]?.className || loadStatusTheme.PENDING.className;
}

/**
 * Get full theme object for a load status
 */
export function getLoadStatusTheme(status: LoadStatus): StatusTheme {
  return loadStatusTheme[status] || loadStatusTheme.PENDING;
}

// =============================================================================
// DISPATCH STATUS THEME
// =============================================================================

export const dispatchStatusTheme: Record<LoadDispatchStatus, StatusTheme> = {
  BOOKED: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  NEEDS_DISPATCH: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  PENDING_DISPATCH: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  DISPATCHED: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ON_ROUTE_TO_PICKUP: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  AT_PICKUP: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  LOADED: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-200',
    className: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  ON_ROUTE_TO_DELIVERY: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-200',
    className: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  AT_DELIVERY: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-200',
    className: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  DELIVERED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELLED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

/**
 * Get status colors for a dispatch status (returns className string)
 */
export function getDispatchStatusColors(status: LoadDispatchStatus): string {
  return dispatchStatusTheme[status]?.className || '';
}

/**
 * Get full theme object for a dispatch status
 */
export function getDispatchStatusTheme(status: LoadDispatchStatus): StatusTheme {
  return dispatchStatusTheme[status] || dispatchStatusTheme.PENDING_DISPATCH;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format a status enum value to human-readable text
 */
export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Status groups for filtering and categorization
 */
export const loadStatusGroups = {
  active: [
    LoadStatus.PENDING,
    LoadStatus.ASSIGNED,
    LoadStatus.EN_ROUTE_PICKUP,
    LoadStatus.AT_PICKUP,
    LoadStatus.LOADED,
    LoadStatus.EN_ROUTE_DELIVERY,
    LoadStatus.AT_DELIVERY,
  ],
  inTransit: [
    LoadStatus.ASSIGNED,
    LoadStatus.EN_ROUTE_PICKUP,
    LoadStatus.AT_PICKUP,
    LoadStatus.LOADED,
    LoadStatus.EN_ROUTE_DELIVERY,
    LoadStatus.AT_DELIVERY,
  ],
  billing: [
    LoadStatus.DELIVERED,
    LoadStatus.BILLING_HOLD,
    LoadStatus.READY_TO_BILL,
    LoadStatus.INVOICED,
  ],
  completed: [LoadStatus.PAID],
  cancelled: [LoadStatus.CANCELLED],
};

/**
 * All possible load statuses for dropdowns
 */
export const allLoadStatuses = Object.values(LoadStatus);

/**
 * All possible dispatch statuses for dropdowns
 */
export const allDispatchStatuses = Object.values(LoadDispatchStatus);



