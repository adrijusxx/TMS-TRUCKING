/**
 * Centralized branding constants.
 * Import from here — never hardcode brand strings anywhere in the app.
 * To rebrand, update values here and everything follows.
 */

export const APP_NAME = 'Alogix'
export const APP_SHORT_DESCRIPTION = 'Logistics Technology & TMS'
export const APP_FULL_TITLE = `${APP_NAME} - ${APP_SHORT_DESCRIPTION}`
export const APP_DESCRIPTION = `${APP_NAME} - Transportation management system and logistics platform`

// Product tier name (used in marketing, Stripe, trial emails)
export const PRODUCT_PRO_TIER = `${APP_NAME} Pro`

// Contact info
export const SUPPORT_EMAIL = 'support@alogix.info'
export const LEGAL_EMAIL = 'legal@alogix.info'
export const PRIVACY_EMAIL = 'privacy@alogix.info'
export const SUPPORT_PHONE = '1-800-ALOGIX-1'
export const LEGAL_ADDRESS = '123 Freight Avenue, Suite 100, Chicago, IL 60601'

// PWA / mobile
export const PWA_NAME = `${APP_NAME} Driver`
export const PWA_SHORT_NAME = APP_NAME

// HTTP User-Agent for outbound API requests
export const HTTP_USER_AGENT = `${APP_NAME}-App/1.0`

// Copyright line (used in email footers, etc.)
export const COPYRIGHT_LINE = `© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.`
