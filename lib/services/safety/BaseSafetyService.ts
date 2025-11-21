import { PrismaClient } from '@prisma/client';

/**
 * Base service class for all safety-related services
 * Provides common functionality and error handling
 */
export abstract class BaseSafetyService {
  protected prisma: PrismaClient;
  protected companyId?: string;
  protected mcNumberId?: string;

  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    this.prisma = prisma;
    this.companyId = companyId;
    this.mcNumberId = mcNumberId;
  }

  protected getCompanyFilter() {
    return {
      companyId: this.companyId,
      ...(this.mcNumberId && { mcNumberId: this.mcNumberId })
    };
  }

  /**
   * Validate company access
   */
  protected async validateCompanyAccess(companyId: string, userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCompanies: {
          where: { companyId, isActive: true }
        }
      }
    });

    if (!user) return false;
    if (user.companyId === companyId) return true;
    return user.userCompanies.length > 0;
  }

  /**
   * Common error handler
   */
  protected handleError(error: unknown, context: string): never {
    if (error instanceof Error) {
      throw new Error(`${context}: ${error.message}`);
    }
    throw new Error(`${context}: Unknown error occurred`);
  }

  /**
   * Validate required fields
   */
  protected validateRequiredFields(data: Record<string, unknown>, fields: string[]): void {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}

