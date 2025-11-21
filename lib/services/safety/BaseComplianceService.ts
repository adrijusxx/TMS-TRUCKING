import { PrismaClient } from '@prisma/client';
import { BaseSafetyService } from './BaseSafetyService';

/**
 * Base service class for compliance-related services
 * Extends BaseSafetyService with compliance-specific functionality
 */
export abstract class BaseComplianceService extends BaseSafetyService {
  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }

  /**
   * Check if document is expiring soon
   */
  protected isExpiringSoon(expirationDate: Date, daysThreshold: number = 30): boolean {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + daysThreshold);
    return expirationDate <= thresholdDate && expirationDate >= today;
  }

  /**
   * Check if document is expired
   */
  protected isExpired(expirationDate: Date): boolean {
    return expirationDate < new Date();
  }

  /**
   * Get expiration status
   */
  protected getExpirationStatus(expirationDate: Date | null): 'current' | 'expiring' | 'expired' {
    if (!expirationDate) return 'current';
    if (this.isExpired(expirationDate)) return 'expired';
    if (this.isExpiringSoon(expirationDate)) return 'expiring';
    return 'current';
  }

  /**
   * Calculate days until expiration
   */
  protected daysUntilExpiration(expirationDate: Date): number {
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

