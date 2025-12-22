/**
 * Environment Variable Configuration
 * 
 * Provides centralized environment variable management with AWS Secrets Manager integration.
 * Falls back to process.env for local development.
 * 
 * @see docs/AWS_SECURITY_ARCHITECTURE.md
 */

import { getSecret } from '@/lib/secrets/aws-secrets-manager';
import { experimental_taintUniqueValue as taintUniqueValue } from 'react';

// Cache for environment variables
let envCache: Record<string, string> | null = null;
let initializationPromise: Promise<Record<string, string>> | null = null;

/**
 * Checks if we should use AWS Secrets Manager
 * Returns false in development or if AWS_REGION is not set
 */
function shouldUseSecretsManager(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    !!process.env.AWS_REGION
  );
}

/**
 * Initializes environment variables from AWS Secrets Manager
 * Should be called once at application startup
 */
async function initializeEnvInternal(): Promise<Record<string, string>> {
  if (envCache) return envCache;
  
  // In development or if AWS is not configured, use process.env
  if (!shouldUseSecretsManager()) {
    // Filter out undefined values and convert to Record<string, string>
    envCache = Object.fromEntries(
      Object.entries(process.env).filter(([_, value]) => value !== undefined)
    ) as Record<string, string>;
    return envCache;
  }
  
  try {
    const secrets = await getSecret('tms/environment/config');
    
    // Parse JSON secret if it's a single JSON secret
    let parsedSecrets: Record<string, string> = {};
    try {
      parsedSecrets = JSON.parse(secrets);
    } catch {
      // If not JSON, try fetching individual secrets
      const secretNames = [
        'tms/database/connection-url',
        'tms/database/connection-url-migrate',
        'tms/nextauth/secret',
      ];
      
      // Fetch secrets in parallel (but we'll handle this differently)
      // For now, use individual secret fetching pattern
      // Filter out undefined values and convert to Record<string, string>
      envCache = Object.fromEntries(
        Object.entries(process.env).filter(([_, value]) => value !== undefined)
      ) as Record<string, string>;
      
      return envCache;
    }
    
    // Filter out undefined values from process.env and merge with parsed secrets
    const filteredEnv = Object.fromEntries(
      Object.entries(process.env).filter(([_, value]) => value !== undefined)
    ) as Record<string, string>;
    
    envCache = {
      ...filteredEnv, // Keep non-secret env vars
      ...parsedSecrets,
    };
    
    // Mark secrets as tainted to prevent client-side exposure
    if (typeof window === 'undefined') {
      const lifetime = {}; // Lifetime object for taint tracking
      Object.entries(envCache).forEach(([key, value]) => {
        if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) {
          taintUniqueValue(`Secret ${key}`, lifetime, value);
        }
      });
    }
    
    return envCache;
  } catch (error) {
    console.warn('[Env] Failed to initialize from AWS Secrets Manager, falling back to process.env:', error);
    // Filter out undefined values and convert to Record<string, string>
    envCache = Object.fromEntries(
      Object.entries(process.env).filter(([_, value]) => value !== undefined)
    ) as Record<string, string>;
    return envCache;
  }
}

/**
 * Initializes environment variables (with promise caching to prevent multiple initializations)
 */
export async function initializeEnv(): Promise<Record<string, string>> {
  if (envCache) return envCache;
  
  if (!initializationPromise) {
    initializationPromise = initializeEnvInternal();
  }
  
  return initializationPromise;
}

/**
 * Gets an environment variable
 * Falls back to process.env for development/local
 * 
 * Note: For secrets, use the server-only getters from lib/secrets/server-only.ts
 */
export function getEnv(key: string): string {
  if (!shouldUseSecretsManager() || !envCache) {
    return process.env[key] || '';
  }
  return envCache[key] || '';
}

/**
 * Gets all environment variables
 */
export function getAllEnv(): Record<string, string> {
  if (!shouldUseSecretsManager() || !envCache) {
    // Filter out undefined values and convert to Record<string, string>
    return Object.fromEntries(
      Object.entries(process.env).filter(([_, value]) => value !== undefined)
    ) as Record<string, string>;
  }
  return envCache;
}

/**
 * Clears the environment cache (useful for testing)
 */
export function clearEnvCache(): void {
  envCache = null;
  initializationPromise = null;
}

