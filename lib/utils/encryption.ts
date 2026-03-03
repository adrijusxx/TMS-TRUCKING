/**
 * Encryption utilities for sensitive data
 *
 * Uses AES-256-GCM for authenticated encryption.
 * Requires ENCRYPTION_KEY env var (64-char hex string = 32 bytes).
 * Falls back to base64 encoding in development if key is not set.
 */

import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('ENCRYPTION_KEY is required in production');
    }
    return null;
  }
  if (keyHex.length !== 64) {
    logger.error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    return null;
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM.
 * Returns base64-encoded string containing iv + authTag + ciphertext.
 */
export function encrypt(data: string): string {
  const key = getKey();
  if (!key) {
    // Dev fallback — NOT secure
    return Buffer.from(data).toString('base64');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data, 'utf-8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv (16) + authTag (16) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypt data encrypted with encrypt().
 */
export function decrypt(encryptedData: string): string {
  const key = getKey();
  if (!key) {
    // Dev fallback
    return Buffer.from(encryptedData, 'base64').toString('utf-8');
  }

  const packed = Buffer.from(encryptedData, 'base64');

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf-8');
}
