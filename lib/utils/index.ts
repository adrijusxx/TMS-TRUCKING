import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getPublicEnv } from '@/lib/env-client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  } catch (e) {
    return 'Invalid Date';
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Get the basePath for API calls
 * Uses NEXT_PUBLIC_BASE_PATH environment variable only (not URL detection)
 * For subdomain deployment (tms.vaidera.eu): returns empty string
 * For subdirectory deployment (domain.com/tms): returns '/tms'
 * Don't detect from URL as it may already have basePath appended
 */
function getBasePath(): string {
  return getPublicEnv('NEXT_PUBLIC_BASE_PATH') || '';
}

/**
 * Construct an API URL with basePath
 * @param path - API path (e.g., '/api/activity' or 'api/activity')
 * @returns Full API URL with basePath (e.g., '/tms/api/activity')
 */
export function apiUrl(path: string): string {
  const basePath = getBasePath();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Ensure basePath doesn't end with /
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${normalizedBasePath}${normalizedPath}`;
}


export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
